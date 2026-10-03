import { Router } from 'express';
import { toggleBookmark, getBookmarks } from '../controllers/bookmarkController.js';
import { authenticate } from '../middleware/auth.js';
import { userActionLimiter } from '../middleware/rateLimiter.js';
import { validateParams } from '../middleware/validate.js';
import { idParamSchema } from '../validators/index.js';

const router = Router();

router.get('/', authenticate, userActionLimiter, getBookmarks);
router.post('/post/:id', authenticate, userActionLimiter, validateParams(idParamSchema), toggleBookmark);

export default router;
