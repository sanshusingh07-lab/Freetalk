import { Router } from 'express';
import { 
  getActiveThought, 
  respondToThought, 
  getDebates, 
  voteDebate, 
  createDebate,
  voteMindChange,
  getRandomPrompt,
  getIdeas, 
  voteIdea 
} from '../controllers/debateController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { publicLimiter, userActionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Thought of the Day
router.get('/thought-of-day', publicLimiter, optionalAuth, getActiveThought);
router.post('/thought-of-day/:id/respond', authenticate, userActionLimiter, respondToThought);

// Blind Debates (Feature 1)
router.get('/debates', publicLimiter, optionalAuth, getDebates);
router.post('/debates', authenticate, userActionLimiter, createDebate);
router.post('/debates/:id/vote', authenticate, userActionLimiter, voteDebate);

// "What Changed My Mind?" (Feature 12)
router.post('/mind-change', authenticate, userActionLimiter, voteMindChange);

// "Random Conversation" (Feature 14)
router.get('/random-prompt', publicLimiter, optionalAuth, getRandomPrompt);

// Idea vs Idea
router.get('/ideas', publicLimiter, optionalAuth, getIdeas);
router.post('/ideas/:id/vote', authenticate, userActionLimiter, voteIdea);

export default router;
