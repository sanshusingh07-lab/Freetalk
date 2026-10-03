import { Router } from 'express';
import { createReport } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { reportLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import { reportSchema } from '../validators/index.js';

const router = Router();

router.post('/', authenticate, reportLimiter, validateBody(reportSchema), createReport);

export default router;
