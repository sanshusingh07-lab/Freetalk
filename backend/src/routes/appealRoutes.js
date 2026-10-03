import { Router } from 'express';
import { createAppeal, getAppeals, reviewAppeal } from '../controllers/appealController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { userActionLimiter } from '../middleware/rateLimiter.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { appealSchema, reviewAppealSchema, idParamSchema } from '../validators/index.js';

const router = Router();

router.post('/', authenticate, userActionLimiter, validateBody(appealSchema), createAppeal);
router.get('/', authenticate, requireRole('MODERATOR', 'ADMIN'), getAppeals);
router.post('/:id/review', authenticate, requireRole('MODERATOR', 'ADMIN'), userActionLimiter, validateParams(idParamSchema), validateBody(reviewAppealSchema), reviewAppeal);

export default router;
