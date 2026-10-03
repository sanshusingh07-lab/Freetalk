import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach Bearer token fallback for cross-domain deployments
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('freetalk_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // Ignore localStorage access issues
  }
  return config;
});

// Response interceptor to handle unhandled errors cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customMessage = 
      error.response?.data?.message || 
      (error.code === 'ERR_NETWORK' ? "Unable to connect to the FreeTalk server. Please ensure the backend server is running." : error.message) ||
      "A network connection error occurred.";
    const code = error.response?.data?.code || error.code || "NETWORK_ERROR";
    
    // Don't auto-redirect on 401 for optional auth checks
    return Promise.reject({
      status: error.response?.status,
      message: customMessage,
      code,
      data: error.response?.data
    });
  }
);

// Auth Service
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  sendOtp: (data) => api.post('/auth/send-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  regenerateIdentity: () => api.post('/auth/identity/regenerate'),
  updateSettings: (data) => api.patch('/auth/settings', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data)
};

// Posts Service
export const postService = {
  getPosts: (params) => api.get('/posts', { params }),
  getPostById: (id) => api.get(`/posts/${id}`),
  getPerspectives: (id) => api.get(`/posts/${id}/perspectives`),
  createPost: (data) => {
    if (data instanceof FormData) {
      return api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/posts', data);
  },
  deletePost: (id) => api.delete(`/posts/${id}`),
  toggleReaction: (id, reactionType) => api.post(`/reactions/post/${id}`, { reactionType }),
  toggleBookmark: (id, collectionName) => api.post(`/bookmarks/post/${id}`, { collectionName })
};

// Comments Service
export const commentService = {
  getComments: (postId) => api.get(`/comments/post/${postId}`),
  createComment: (postId, data) => api.post(`/comments/post/${postId}`, data),
  deleteComment: (id) => api.delete(`/comments/${id}`),
  toggleReaction: (id, reactionType) => api.post(`/reactions/comment/${id}`, { reactionType })
};

// Topics Service
export const topicService = {
  getTopics: () => api.get('/topics'),
  getTopic: (slug) => api.get(`/topics/${slug}`),
  getTopicBySlug: (slug) => api.get(`/topics/${slug}`),
  toggleFollow: (id) => api.post(`/topics/${id}/follow`)
};

// Polls Service
export const pollService = {
  createPoll: (data) => api.post('/polls', data),
  vote: (pollId, optionId) => api.post(`/polls/${pollId}/vote`, { optionId })
};

// Bookmarks Service
export const bookmarkService = {
  getBookmarks: (params) => api.get('/bookmarks', { params })
};

// Messages Service
export const messageService = {
  getConversations: () => api.get('/messages'),
  getMessages: (conversationId) => api.get(`/messages/${conversationId}`),
  sendMessage: (data) => api.post('/messages', data),
  getRecipients: (search) => api.get('/messages/recipients', { params: { search } })
};

// Notifications Service
export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`)
};

// Reports & Appeals Service
export const safetyService = {
  report: (data) => api.post('/reports', data),
  appeal: (data) => api.post('/appeals', data)
};

// Debates and Unique Features Service
export const featureService = {
  getThoughtOfDay: () => api.get('/features/thought-of-day'),
  respondThought: (id, content) => api.post(`/features/thought-of-day/${id}/respond`, { content }),
  getDebates: () => api.get('/features/debates'),
  createDebate: (data) => api.post('/features/debates', data),
  voteDebate: (id, side) => api.post(`/features/debates/${id}/vote`, { side }),
  voteMindChange: (data) => api.post('/features/mind-change', data),
  getRandomPrompt: () => api.get('/features/random-prompt'),
  getIdeas: () => api.get('/features/ideas'),
  voteIdea: (id, option) => api.post(`/features/ideas/${id}/vote`, { option })
};

// Argument Quality Service (Feature 13)
export const qualityService = {
  voteQuality: (data) => api.post('/quality/vote', data)
};

// User Profile & Privacy
export const userService = {
  getActivity: () => api.get('/user/activity'),
  getPrivacyCenter: () => api.get('/user/privacy-center'),
  getInsights: () => api.get('/user/insights'),
  toggleGhostMode: () => api.post('/user/ghost-mode'),
  downloadData: () => api.get('/user/data-export', { responseType: 'blob' }),
  deleteAccount: () => api.delete('/user/account')
};

// Moderation & Admin
export const adminService = {
  getModerationQueue: () => api.get('/moderation/queue'),
  takeModerationAction: (reportId, data) => api.post(`/moderation/queue/${reportId}/action`, data),
  getAppeals: () => api.get('/appeals'),
  reviewAppeal: (appealId, data) => api.post(`/appeals/${appealId}/review`, data),
  getStats: () => api.get('/admin/stats'),
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: () => api.get('/admin/users'),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data)
};

// In-Built AI Services (Content Predictor, Assistant & Trend Analyzer)
export const aiService = {
  predictContent: (content, title) => api.post('/ai/predict-content', { content, title }),
  chatWithAssistant: (message, chatHistory) => api.post('/ai/assistant/chat', { message, chatHistory }),
  getTrendingInsights: () => api.get('/ai/trending-insights')
};
