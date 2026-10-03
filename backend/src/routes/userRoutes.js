import { Router } from 'express';
import { 
  getMyActivity, 
  getPrivacyDashboard, 
  downloadUserData, 
  deleteAccount,
  getPersonalInsights,
  toggleGhostMode
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { userActionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate, userActionLimiter);

router.get('/activity', getMyActivity);
router.get('/privacy-center', getPrivacyDashboard);
router.get('/data-export', downloadUserData);
router.get('/insights', getPersonalInsights);
router.post('/ghost-mode', toggleGhostMode);
router.delete('/account', deleteAccount);

export default router;
