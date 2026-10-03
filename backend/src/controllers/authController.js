import argon2 from 'argon2';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { signToken, attachTokenCookie, clearTokenCookie } from '../utils/tokenUtils.js';
import { generateAnonymousIdentity } from '../utils/identityGenerator.js';
import { serializeUser } from '../utils/safeUserSerializer.js';
import { registerSchema, loginSchema, userSettingsSchema, changePasswordSchema, sendOtpSchema, verifyOtpSchema } from '../validators/index.js';
import { sendSignupEmail, sendLoginNotificationEmail, sendOtpEmail } from '../services/emailService.js';
import { recordAuthFailure, recordAuthSuccess } from '../middleware/rateLimiter.js';


export async function register(req, res, next) {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
        code: "EMAIL_EXISTS"
      });
    }

    const passwordHash = await argon2.hash(validated.password);

    // Create user and first anonymous identity in transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: validated.email.toLowerCase(),
          passwordHash,
          interests: validated.interests || ["technology", "ai", "opinions"],
          identityPreference: validated.identityPreference || 'PERSISTENT'
        }
      });

      const identityData = generateAnonymousIdentity();
      await tx.anonymousIdentity.create({
        data: {
          ...identityData,
          identityType: 'PERSISTENT',
          userId: newUser.id
        }
      });

      // Also follow initial interest topics
      if (validated.interests && validated.interests.length > 0) {
        const topics = await tx.topic.findMany({
          where: { slug: { in: validated.interests } }
        });
        for (const topic of topics) {
          await tx.topicFollow.create({
            data: { userId: newUser.id, topicId: topic.id }
          });
        }
      }

      return newUser;
    });

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        identities: { where: { identityType: 'PERSISTENT' }, take: 1 },
        followedTopics: { include: { topic: true } }
      }
    });

    const token = signToken({ userId: user.id, role: user.role });
    attachTokenCookie(res, token);

    // Dispatch welcome / signup confirmation email asynchronously
    const primaryIdentity = fullUser.identities[0];
    sendSignupEmail({
      to: fullUser.email,
      displayName: primaryIdentity?.displayName || 'Anonymous Thinker',
      email: fullUser.email
    }).catch(err => console.error('[Email Dispatch Error]', err));

    return res.status(201).json({
      success: true,
      message: "Welcome to FreeTalk! Your anonymous identity has been created.",
      user: serializeUser(fullUser, primaryIdentity),
      token
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
      include: {
        identities: { where: { identityType: 'PERSISTENT' }, take: 1 }
      }
    });

    if (!user) {
      recordAuthFailure(validated.email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        code: "INVALID_CREDENTIALS"
      });
    }

    const isValidPassword = await argon2.verify(user.passwordHash, validated.password);
    if (!isValidPassword) {
      recordAuthFailure(validated.email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        code: "INVALID_CREDENTIALS"
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended due to Community Guidelines violations.",
        code: "ACCOUNT_SUSPENDED"
      });
    }

    // Reset failed attempt counter on successful login
    recordAuthSuccess(validated.email);

    const token = signToken({ userId: user.id, role: user.role });
    attachTokenCookie(res, token);

    // Extract client IP and User-Agent
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    // Dispatch login security notification email asynchronously
    const primaryIdentity = user.identities[0];
    sendLoginNotificationEmail({
      to: user.email,
      email: user.email,
      displayName: primaryIdentity?.displayName || 'Anonymous Member',
      ip: clientIp,
      userAgent,
      timestamp: new Date()
    }).catch(err => console.error('[Email Dispatch Error]', err));

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      user: serializeUser(user, primaryIdentity),
      token
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  clearTokenCookie(res);
  return res.status(200).json({
    success: true,
    message: "Logged out successfully."
  });
}

export async function getMe(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated.",
        code: "UNAUTHORIZED"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        identities: { where: { identityType: 'PERSISTENT' }, take: 1 },
        followedTopics: { include: { topic: true } },
        _count: {
          select: {
            posts: true,
            comments: true,
            bookmarks: true,
            pollVotes: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      user: serializeUser(user, user.identities[0]),
      stats: {
        postsCount: user._count.posts,
        commentsCount: user._count.comments,
        bookmarksCount: user._count.bookmarks,
        pollVotesCount: user._count.pollVotes
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function regenerateIdentity(req, res, next) {
  try {
    const userId = req.user.id;
    const newIdentityData = generateAnonymousIdentity();

    // Check if user has an existing persistent identity
    const existing = await prisma.anonymousIdentity.findFirst({
      where: { userId, identityType: 'PERSISTENT' }
    });

    let identity;
    if (existing) {
      identity = await prisma.anonymousIdentity.update({
        where: { id: existing.id },
        data: newIdentityData
      });
    } else {
      identity = await prisma.anonymousIdentity.create({
        data: {
          ...newIdentityData,
          identityType: 'PERSISTENT',
          userId
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: `Your identity has been regenerated: ${identity.displayName}`,
      identity
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const validated = userSettingsSchema.parse(req.body);
    const userId = req.user.id;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: validated,
      include: {
        identities: { where: { identityType: 'PERSISTENT' }, take: 1 }
      }
    });

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully.",
      user: serializeUser(updated, updated.identities[0])
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res) {
  // Safe mock endpoint that does not disclose whether email exists
  return res.status(200).json({
    success: true,
    message: "If an account matches this email, password reset instructions have been dispatched."
  });
}

export async function changePassword(req, res, next) {
  try {
    const validated = changePasswordSchema.parse(req.body);
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const isValid = await argon2.verify(user.passwordHash, validated.currentPassword);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
        code: "INVALID_CURRENT_PASSWORD"
      });
    }

    if (validated.currentPassword === validated.newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password.",
        code: "PASSWORD_UNCHANGED"
      });
    }

    const newPasswordHash = await argon2.hash(validated.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully."
    });
  } catch (err) {
    next(err);
  }
}

export async function sendOtp(req, res, next) {
  try {
    const validated = sendOtpSchema.parse(req.body);
    const { email, purpose } = validated;
    const normalizedEmail = email.toLowerCase().trim();

    if (purpose === 'LOGIN') {
      // For login: we need to also validate the password was correct before sending OTP
      // The password is sent in the same request body
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required.', code: 'MISSING_PASSWORD' });
      }

      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        recordAuthFailure(normalizedEmail);
        return res.status(401).json({ success: false, message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' });
      }

      const isValidPassword = await argon2.verify(user.passwordHash, password);
      if (!isValidPassword) {
        recordAuthFailure(normalizedEmail);
        return res.status(401).json({ success: false, message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' });
      }

      if (user.status === 'SUSPENDED') {
        return res.status(403).json({ success: false, message: 'Your account is suspended due to Community Guidelines violations.', code: 'ACCOUNT_SUSPENDED' });
      }

      // Admins skip OTP — log them in directly
      if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
        recordAuthSuccess(normalizedEmail);
        const fullUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { identities: { where: { identityType: 'PERSISTENT' }, take: 1 } }
        });
        const token = signToken({ userId: user.id, role: user.role });
        attachTokenCookie(res, token);
        return res.status(200).json({
          success: true,
          otpRequired: false,
          message: 'Signed in directly (staff account).',
          user: serializeUser(fullUser, fullUser.identities[0]),
          token
        });
      }
    }

    if (purpose === 'REGISTER') {
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.', code: 'EMAIL_EXISTS' });
      }
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + crypto.randomInt(900000))).padStart(6, '0');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing unused OTPs for this email+purpose
    await prisma.emailOtp.updateMany({
      where: { email: normalizedEmail, purpose, used: false },
      data: { used: true }
    });

    // Store new OTP
    await prisma.emailOtp.create({
      data: { email: normalizedEmail, code, purpose, expiresAt }
    });

    // Send email with fallback
    let emailResult = { success: false, code };
    try {
      emailResult = await sendOtpEmail({ to: normalizedEmail, code, purpose });
    } catch (e) {
      console.warn('[sendOtp Warning] Email dispatch timed out/failed:', e.message);
    }

    return res.status(200).json({
      success: true,
      otpRequired: true,
      emailDelivered: emailResult.success,
      message: emailResult.success
        ? `Verification code sent to ${normalizedEmail}. Please check your inbox or spam folder.`
        : `Verification code generated! (Cloud host email restricted. Use code: ${code})`,
      devCode: !emailResult.success ? code : undefined
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/verify-otp
 * Verifies the 6-digit OTP. On success:
 * - LOGIN: issues session token
 * - REGISTER: creates account + issues token
 */
export async function verifyOtp(req, res, next) {
  try {
    const validated = verifyOtpSchema.parse(req.body);
    const { email, code, purpose, password, interests, identityPreference } = validated;
    const normalizedEmail = email.toLowerCase().trim();

    // Find a valid, unused, non-expired OTP
    const otpRecord = await prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        code,
        purpose,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new one.',
        code: 'INVALID_OTP'
      });
    }

    // Mark OTP as used
    await prisma.emailOtp.update({ where: { id: otpRecord.id }, data: { used: true } });

    if (purpose === 'LOGIN') {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { identities: { where: { identityType: 'PERSISTENT' }, take: 1 } }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Account not found.', code: 'NOT_FOUND' });
      }

      recordAuthSuccess(normalizedEmail);
      const token = signToken({ userId: user.id, role: user.role });
      attachTokenCookie(res, token);

      const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';
      const primaryIdentity = user.identities[0];

      sendLoginNotificationEmail({
        to: user.email,
        email: user.email,
        displayName: primaryIdentity?.displayName || 'Anonymous Member',
        ip: clientIp,
        userAgent,
        timestamp: new Date()
      }).catch(err => console.error('[Email Dispatch Error]', err));

      return res.status(200).json({
        success: true,
        message: 'Email verified. Logged in successfully.',
        user: serializeUser(user, primaryIdentity),
        token
      });
    }

    if (purpose === 'REGISTER') {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required to complete registration.', code: 'MISSING_PASSWORD' });
      }

      const passwordHash = await argon2.hash(password);

      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            passwordHash,
            interests: interests || ['technology', 'ai', 'opinions'],
            identityPreference: identityPreference || 'PERSISTENT'
          }
        });

        const identityData = generateAnonymousIdentity();
        await tx.anonymousIdentity.create({
          data: { ...identityData, identityType: 'PERSISTENT', userId: newUser.id }
        });

        if (interests && interests.length > 0) {
          const topics = await tx.topic.findMany({ where: { slug: { in: interests } } });
          for (const topic of topics) {
            await tx.topicFollow.create({ data: { userId: newUser.id, topicId: topic.id } });
          }
        }

        return newUser;
      });

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          identities: { where: { identityType: 'PERSISTENT' }, take: 1 },
          followedTopics: { include: { topic: true } }
        }
      });

      const primaryIdentity = fullUser.identities[0];
      const token = signToken({ userId: user.id, role: user.role });
      attachTokenCookie(res, token);

      sendSignupEmail({
        to: fullUser.email,
        displayName: primaryIdentity?.displayName || 'Anonymous Thinker',
        email: fullUser.email
      }).catch(err => console.error('[Email Dispatch Error]', err));

      return res.status(201).json({
        success: true,
        message: 'Email verified. Welcome to FreeTalk! Your anonymous identity has been created.',
        user: serializeUser(fullUser, primaryIdentity),
        token
      });
    }
  } catch (err) {
    next(err);
  }
}
