import { Router } from 'express';
import { voteArgumentQuality } from '../controllers/qualityController.js';
import { authenticate } from '../middleware/auth.js';
import { userActionLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import { qualityVoteSchema } from '../validators/index.js';

const router = Router();

router.post('/vote', authenticate, userActionLimiter, validateBody(qualityVoteSchema), voteArgumentQuality);

export default router;
