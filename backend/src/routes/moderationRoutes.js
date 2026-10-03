import { Router } from 'express';
import { getModerationQueue, takeModerationAction } from '../controllers/moderationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { userActionLimiter } from '../middleware/rateLimiter.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { idParamSchema, moderationActionSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate, requireRole('MODERATOR', 'ADMIN'));

router.get('/queue', getModerationQueue);
router.post('/queue/:id/action', userActionLimiter, validateParams(idParamSchema), validateBody(moderationActionSchema), takeModerationAction);

export default router;
