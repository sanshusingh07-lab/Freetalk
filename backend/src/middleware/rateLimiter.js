import rateLimit from 'express-rate-limit';

// --- Configurable Environment Variables ---
const AUTH_WINDOW_MS = parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || String(15 * 60 * 1000), 10);
const AUTH_MAX_IP = parseInt(process.env.RATE_LIMIT_AUTH_MAX_IP || '20', 10);
const AUTH_ACCOUNT_MAX = parseInt(process.env.RATE_LIMIT_AUTH_ACCOUNT_MAX || '5', 10);
const AUTH_MAX_BACKOFF_SEC = parseInt(process.env.RATE_LIMIT_AUTH_MAX_BACKOFF_SEC || '900', 10); // 15 min max

const PUBLIC_WINDOW_MS = parseInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS || String(15 * 60 * 1000), 10);
const PUBLIC_MAX = parseInt(process.env.RATE_LIMIT_PUBLIC_MAX || '300', 10);

const USER_WINDOW_MS = parseInt(process.env.RATE_LIMIT_USER_WINDOW_MS || String(60 * 1000), 10);
const USER_MAX = parseInt(process.env.RATE_LIMIT_USER_MAX || '120', 10);

const POST_MAX = parseInt(process.env.RATE_LIMIT_POST_MAX || '10', 10);
const COMMENT_MAX = parseInt(process.env.RATE_LIMIT_COMMENT_MAX || '25', 10);
const MESSAGE_MAX = parseInt(process.env.RATE_LIMIT_MESSAGE_MAX || '40', 10);
const REPORT_MAX = parseInt(process.env.RATE_LIMIT_REPORT_MAX || '5', 10);

// --- In-Memory Store for Account-Keyed Exponential Backoff ---
const authFailureStore = new Map();

// Periodic cleanup of stale entries (every 10 minutes)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, data] of authFailureStore.entries()) {
    if (now - data.lastFailureTime > AUTH_WINDOW_MS) {
      authFailureStore.delete(key);
    }
  }
}, 10 * 60 * 1000);
if (cleanupTimer.unref) cleanupTimer.unref();

/**
 * Record a failed authentication attempt for per-account exponential backoff.
 */
export function recordAuthFailure(accountKey) {
  if (!accountKey) return;
  const key = accountKey.toLowerCase().trim();
  const existing = authFailureStore.get(key) || { count: 0, lastFailureTime: 0 };
  authFailureStore.set(key, {
    count: existing.count + 1,
    lastFailureTime: Date.now()
  });
}

/**
 * Reset failure counter upon successful authentication.
 */
export function recordAuthSuccess(accountKey) {
  if (!accountKey) return;
  const key = accountKey.toLowerCase().trim();
  authFailureStore.delete(key);
}

/**
 * Middleware: Exponential backoff check per account (email) before authentication.
 */
export function authExponentialBackoff(req, res, next) {
  const email = req.body?.email;
  const accountKey = typeof email === 'string' && email.trim() ? email.toLowerCase().trim() : null;

  if (!accountKey) {
    return next();
  }

  const record = authFailureStore.get(accountKey);
  if (!record || record.count < AUTH_ACCOUNT_MAX) {
    return next();
  }

  const now = Date.now();
  // Exponential delay calculation: 2^(failures - threshold) in seconds, capped at AUTH_MAX_BACKOFF_SEC
  const exponent = record.count - AUTH_ACCOUNT_MAX;
  const delaySec = Math.min(Math.pow(2, exponent), AUTH_MAX_BACKOFF_SEC);
  const elapsedMs = now - record.lastFailureTime;
  const delayMs = delaySec * 1000;

  if (elapsedMs < delayMs) {
    const remainingSec = Math.ceil((delayMs - elapsedMs) / 1000);
    res.setHeader('Retry-After', remainingSec);
    return res.status(429).json({
      success: false,
      message: `Too many consecutive failed login attempts. Please wait ${remainingSec} second(s) before trying again.`,
      code: "AUTH_BACKOFF_ACTIVE",
      retryAfter: remainingSec
    });
  }

  next();
}

/**
 * Tier 1: Stricter rate limiter for authentication routes (per-IP).
 */
export const authIpLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX_IP,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication requests from this IP. Please wait a few minutes before trying again.",
    code: "AUTH_IP_RATE_LIMIT_EXCEEDED"
  }
});

/**
 * Combined authentication limiter middleware: checks IP limit and account-keyed exponential backoff.
 */
export const authLimiter = [authIpLimiter, authExponentialBackoff];

/**
 * Tier 2: Moderate limits on public discovery endpoints (topics, debates, thought of the day, search).
 */
export const publicLimiter = rateLimit({
  windowMs: PUBLIC_WINDOW_MS,
  max: PUBLIC_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Public browsing rate limit exceeded. Please slow down your requests.",
    code: "PUBLIC_RATE_LIMIT_EXCEEDED"
  }
});

/**
 * Tier 3: Looser limits on authenticated general user actions.
 */
export const userActionLimiter = rateLimit({
  windowMs: USER_WINDOW_MS,
  max: USER_MAX,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "You are making requests too quickly. Please wait a moment.",
    code: "USER_RATE_LIMIT_EXCEEDED"
  }
});

/**
 * Dedicated limiter for creating posts.
 */
export const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: POST_MAX,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "You are posting too fast. Please take a breath and try again shortly.",
    code: "POST_RATE_LIMIT_EXCEEDED"
  }
});

/**
 * Dedicated limiter for creating comments.
 */
export const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: COMMENT_MAX,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Comment rate limit reached. Please wait a moment.",
    code: "COMMENT_RATE_LIMIT_EXCEEDED"
  }
});

/**
 * Dedicated limiter for personal chat messages.
 */
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: MESSAGE_MAX,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Message rate limit reached. Please slow down your messages.",
    code: "MESSAGE_RATE_LIMIT_EXCEEDED"
  }
});

/**
 * Dedicated limiter for filing reports.
 */
export const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: REPORT_MAX,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Report rate limit reached. Please wait before filing another report.",
    code: "REPORT_RATE_LIMIT_EXCEEDED"
  }
});
