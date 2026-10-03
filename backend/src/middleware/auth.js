import { verifyToken } from '../utils/tokenUtils.js';
import { prisma } from '../config/db.js';

export async function authenticate(req, res, next) {
  try {
    let token = req.cookies?.access_token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
        code: "UNAUTHORIZED"
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session. Please log in again.",
        code: "INVALID_TOKEN"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        identities: {
          where: { identityType: 'PERSISTENT' },
          take: 1
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
        code: "USER_NOT_FOUND"
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: "This account has been suspended for community guidelines violations.",
        code: "ACCOUNT_SUSPENDED"
      });
    }

    req.user = user;
    req.activeIdentity = user.identities[0] || null;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
      code: "AUTH_ERROR"
    });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    let token = req.cookies?.access_token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            identities: {
              where: { identityType: 'PERSISTENT' },
              take: 1
            }
          }
        });
        if (user && user.status !== 'SUSPENDED') {
          req.user = user;
          req.activeIdentity = user.identities[0] || null;
        }
      }
    }
    next();
  } catch (err) {
    next();
  }
}
