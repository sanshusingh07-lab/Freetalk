import { Router } from 'express';
import { togglePostReaction, toggleCommentReaction } from '../controllers/reactionController.js';
import { authenticate } from '../middleware/auth.js';
import { userActionLimiter } from '../middleware/rateLimiter.js';
import { validateParams, validateBody } from '../middleware/validate.js';
import { idParamSchema, reactionSchema } from '../validators/index.js';

const router = Router();

router.post('/post/:id', authenticate, userActionLimiter, validateParams(idParamSchema), validateBody(reactionSchema), togglePostReaction);
router.post('/comment/:id', authenticate, userActionLimiter, validateParams(idParamSchema), validateBody(reactionSchema), toggleCommentReaction);

export default router;
