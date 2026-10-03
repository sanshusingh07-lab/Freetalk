import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { userActionLimiter } from '../middleware/rateLimiter.js';
import { validateParams } from '../middleware/validate.js';
import { notificationIdParamSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate, userActionLimiter);

router.get('/', getNotifications);
router.patch('/:id/read', validateParams(notificationIdParamSchema), markAsRead);

export default router;
