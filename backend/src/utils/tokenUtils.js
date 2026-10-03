import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Security Fatal] JWT_SECRET environment variable must be set in production.');
    }
    // In dev / test fallback to default or ephemeral secret
    return 'freetalk_super_secure_jwt_secret_key_2026_privacy_first';
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();
const COOKIE_NAME = 'access_token';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function attachTokenCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

export function clearTokenCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax'
  });
}
