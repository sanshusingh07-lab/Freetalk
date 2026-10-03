import { Router } from 'express';
import { createPoll, votePoll } from '../controllers/pollController.js';
import { authenticate } from '../middleware/auth.js';
import { postLimiter, userActionLimiter } from '../middleware/rateLimiter.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { pollSchema, pollIdParamSchema, pollVoteSchema } from '../validators/index.js';

const router = Router();

router.post('/', authenticate, postLimiter, validateBody(pollSchema), createPoll);
router.post('/:pollId/vote', authenticate, userActionLimiter, validateParams(pollIdParamSchema), validateBody(pollVoteSchema), votePoll);

export default router;
