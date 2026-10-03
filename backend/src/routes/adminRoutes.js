import { Router } from 'express';
import { getDashboardStats, getCommunityHealthAnalytics, getUsers, updateUserStatus, createTopic } from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { userActionLimiter } from '../middleware/rateLimiter.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { idParamSchema, updateUserSchema, createTopicSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/stats', getDashboardStats);
router.get('/analytics', getCommunityHealthAnalytics);
router.get('/users', getUsers);
router.patch('/users/:id', userActionLimiter, validateParams(idParamSchema), validateBody(updateUserSchema), updateUserStatus);
router.post('/topics', userActionLimiter, validateBody(createTopicSchema), createTopic);

export default router;
