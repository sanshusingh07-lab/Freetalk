import { Router } from 'express';
import { getTopics, getTopicBySlug, toggleFollowTopic } from '../controllers/topicController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { publicLimiter, userActionLimiter } from '../middleware/rateLimiter.js';
import { validateParams } from '../middleware/validate.js';
import { topicSlugParamSchema, idParamSchema } from '../validators/index.js';

const router = Router();

router.get('/', publicLimiter, optionalAuth, getTopics);
router.get('/:slug', publicLimiter, optionalAuth, validateParams(topicSlugParamSchema), getTopicBySlug);
router.post('/:id/follow', authenticate, userActionLimiter, validateParams(idParamSchema), toggleFollowTopic);

export default router;
