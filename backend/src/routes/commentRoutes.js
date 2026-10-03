import { Router } from 'express';
import { getCommentsByPost, createComment, deleteComment } from '../controllers/commentController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { commentLimiter, publicLimiter, userActionLimiter } from '../middleware/rateLimiter.js';
import { validateParams, validateBody } from '../middleware/validate.js';
import { postIdParamSchema, idParamSchema, commentSchema } from '../validators/index.js';

const router = Router();

router.get('/post/:postId', publicLimiter, optionalAuth, validateParams(postIdParamSchema), getCommentsByPost);
router.post('/post/:postId', authenticate, commentLimiter, validateParams(postIdParamSchema), validateBody(commentSchema), createComment);
router.delete('/:id', authenticate, userActionLimiter, validateParams(idParamSchema), deleteComment);

export default router;
