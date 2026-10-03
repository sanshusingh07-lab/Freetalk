import { Router } from 'express';
import { getConversations, getMessagesByConversation, sendMessage, getRecipients } from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import { messageLimiter } from '../middleware/rateLimiter.js';
import { validateQuery, validateParams, validateBody } from '../middleware/validate.js';
import { recipientSearchSchema, conversationIdParamSchema, messageSchema } from '../validators/index.js';

const router = Router();

router.get('/', authenticate, getConversations);
router.get('/recipients', authenticate, validateQuery(recipientSearchSchema), getRecipients);
router.get('/:conversationId', authenticate, validateParams(conversationIdParamSchema), getMessagesByConversation);
router.post('/', authenticate, messageLimiter, validateBody(messageSchema), sendMessage);

export default router;
