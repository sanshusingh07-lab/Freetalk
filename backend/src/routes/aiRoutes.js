import { Router } from 'express';
import { analyzeContentWithAI } from '../services/aiModerator.js';
import { analyzeTopicTrends } from '../services/aiTopicAnalyzer.js';
import { processAssistantQuery } from '../services/aiAssistantService.js';
import { optionalAuth } from '../middleware/auth.js';
import { publicLimiter, userActionLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import { predictContentSchema, chatAssistantSchema } from '../validators/index.js';

const router = Router();

// Real-time live typing content analyzer
router.post('/predict-content', userActionLimiter, optionalAuth, validateBody(predictContentSchema), async (req, res, next) => {
  try {
    const { content, title } = req.body;
    const result = await analyzeContentWithAI(content || '', title || '');
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// In-built AI Assistant chat endpoint
router.post('/assistant/chat', userActionLimiter, optionalAuth, validateBody(chatAssistantSchema), async (req, res, next) => {
  try {
    const { message, chatHistory } = req.body;
    const userContext = req.user ? {
      userId: req.user.id,
      activeIdentity: req.activeIdentity,
      interests: req.user.interests
    } : null;

    const response = await processAssistantQuery(message.trim(), chatHistory || [], userContext);
    return res.status(200).json({
      success: true,
      response
    });
  } catch (err) {
    next(err);
  }
});

// AI Topic Trend Telemetry
router.get('/trending-insights', publicLimiter, async (req, res, next) => {
  try {
    const trending = await analyzeTopicTrends();
    return res.status(200).json({
      success: true,
      trending
    });
  } catch (err) {
    next(err);
  }
});

export default router;
