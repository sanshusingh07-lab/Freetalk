import { Router } from 'express';
import { getPosts, getPostById, createPost, deletePost, getPostPerspectives } from '../controllers/postController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { postLimiter, publicLimiter, userActionLimiter } from '../middleware/rateLimiter.js';
import { uploadMedia, verifyUploadedMedia } from '../middleware/upload.js';
import { validateQuery, validateParams } from '../middleware/validate.js';
import { postQuerySchema, idParamSchema } from '../validators/index.js';

const router = Router();

router.get('/', publicLimiter, optionalAuth, validateQuery(postQuerySchema), getPosts);
router.get('/:id', publicLimiter, optionalAuth, validateParams(idParamSchema), getPostById);
router.get('/:id/perspectives', publicLimiter, optionalAuth, validateParams(idParamSchema), getPostPerspectives);
router.post('/', authenticate, postLimiter, uploadMedia.single('media'), verifyUploadedMedia, createPost);
router.delete('/:id', authenticate, userActionLimiter, validateParams(idParamSchema), deletePost);

export default router;
