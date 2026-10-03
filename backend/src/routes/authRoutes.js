import { Router } from 'express';
import { register, login, logout, getMe, regenerateIdentity, updateSettings, forgotPassword, changePassword, sendOtp, verifyOtp } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema, userSettingsSchema, changePasswordSchema, forgotPasswordSchema, sendOtpSchema, verifyOtpSchema } from '../validators/index.js';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp', authLimiter, validateBody(verifyOtpSchema), verifyOtp);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/identity/regenerate', authenticate, regenerateIdentity);
router.patch('/settings', authenticate, validateBody(userSettingsSchema), updateSettings);
router.post('/change-password', authenticate, authLimiter, validateBody(changePasswordSchema), changePassword);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), forgotPassword);

export default router;

