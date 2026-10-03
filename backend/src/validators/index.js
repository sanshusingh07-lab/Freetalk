import { z } from 'zod';

// --- Shared Primitive Validators ---
export const uuidSchema = z.string().uuid({ message: "Invalid identifier format" });
export const idParamSchema = z.object({ id: uuidSchema });
export const postIdParamSchema = z.object({ postId: uuidSchema });
export const commentIdParamSchema = z.object({ id: uuidSchema });
export const pollIdParamSchema = z.object({ pollId: uuidSchema });
export const appealIdParamSchema = z.object({ appealId: uuidSchema });
export const reportIdParamSchema = z.object({ reportId: uuidSchema });
export const topicSlugParamSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, { message: "Invalid topic slug format" })
});
export const conversationIdParamSchema = z.object({
  conversationId: z.string().min(3).max(100)
});

export const notificationIdParamSchema = z.object({
  id: z.string().refine(val => val === 'all' || z.string().uuid().safeParse(val).success, {
    message: "Invalid notification ID format"
  })
});

// --- Auth Schemas ---
export const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address format" }).max(255),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }).max(128),
  interests: z.array(z.string().max(50)).max(15).optional(),
  identityPreference: z.enum(['PERSISTENT', 'TEMPORARY']).optional()
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address format" }).max(255),
  password: z.string().min(1, { message: "Password is required" }).max(128)
});

export const sendOtpSchema = z.object({
  email: z.string().email({ message: "Invalid email address format" }).max(255),
  purpose: z.enum(['LOGIN', 'REGISTER']).default('LOGIN')
});

export const verifyOtpSchema = z.object({
  email: z.string().email({ message: "Invalid email address format" }).max(255),
  code: z.string().length(6, { message: "Verification code must be 6 digits" }).regex(/^\d{6}$/, { message: "Code must be 6 numeric digits" }),
  purpose: z.enum(['LOGIN', 'REGISTER']).default('LOGIN'),
  // Registration-only fields
  password: z.string().min(8).max(128).optional(),
  interests: z.array(z.string().max(50)).max(15).optional(),
  identityPreference: z.enum(['PERSISTENT', 'TEMPORARY']).optional()
});


export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address format" }).max(255)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }).max(128),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters long" }).max(128)
});

export const userSettingsSchema = z.object({
  interests: z.array(z.string().max(50)).max(15).optional(),
  identityPreference: z.enum(['PERSISTENT', 'TEMPORARY']).optional(),
  messagePermission: z.enum(['EVERYONE', 'RESTRICTED', 'NOBODY']).optional(),
  personalizedFeed: z.boolean().optional(),
  activityVisibility: z.enum(['PUBLIC_ANON', 'PRIVATE']).optional()
});

// --- Post Schemas ---
export const postSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }).max(250),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }).max(20000),
  topicId: uuidSchema,
  postType: z.enum(['DISCUSSION', 'QUESTION', 'POLL', 'IMAGE', 'LINK']).default('DISCUSSION'),
  hashtags: z.array(z.string().max(30).regex(/^[a-zA-Z0-9_-]+$/, { message: "Invalid hashtag format" })).max(10).optional().default([]),
  allowComments: z.boolean().optional().default(true),
  useTemporaryIdentity: z.boolean().optional().default(false),
  statementType: z.enum(['OPINION', 'FACT', 'QUESTION', 'IDEA', 'INFORMATION']).optional().default('OPINION'),
  isChallengeOpinion: z.boolean().optional().default(false),
  sourceUrl: z.string().max(500).optional().nullable(),
  sourceTitle: z.string().max(200).optional().nullable(),
  sourceType: z.string().max(50).optional().nullable(),
  slowMode: z.boolean().optional().default(false),
  slowModeSeconds: z.coerce.number().min(5).max(300).optional().default(30),
  language: z.string().max(10).optional().default('en'),
  mediaUrl: z.string().max(500).optional().nullable()
});

export const postQuerySchema = z.object({
  feed: z.enum(['for-you', 'trending', 'top-rated', 'explore', 'recent', 'home', 'top']).optional(),
  statementType: z.enum(['ALL', 'OPINION', 'FACT', 'QUESTION', 'IDEA', 'INFORMATION', 'all']).optional(),
  language: z.string().max(10).optional(),
  topicId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  postType: z.enum(['DISCUSSION', 'QUESTION', 'POLL', 'IMAGE', 'LINK']).optional()
});

// --- Comment Schemas ---
export const commentSchema = z.object({
  content: z.string().min(1, { message: "Comment cannot be empty" }).max(3000),
  parentId: z.string().uuid().optional().nullable(),
  challengeType: z.enum(['AGREE', 'DISAGREE', 'EVIDENCE', 'ALTERNATIVE']).optional().nullable()
});

// --- Reaction Schema ---
export const reactionSchema = z.object({
  reactionType: z.enum(['AGREE', 'INSIGHTFUL', 'THOUGHT_PROVOKING', 'FUNNY', 'STRONG_POINT'], {
    message: "Invalid reaction type"
  })
});

// --- Poll Schemas ---
export const pollSchema = z.object({
  question: z.string().min(5, { message: "Poll question must be at least 5 characters" }).max(250),
  options: z.array(z.string().min(1).max(100)).min(2, { message: "At least 2 options required" }).max(6),
  topicId: uuidSchema,
  durationDays: z.coerce.number().min(1).max(30).optional().default(7)
});

export const pollVoteSchema = z.object({
  optionId: uuidSchema
});

// --- Safety & Report Schemas ---
export const reportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT', 'MESSAGE', 'USER']),
  targetId: uuidSchema,
  reason: z.enum([
    'HARASSMENT', 'HATE_SPEECH', 'THREAT', 'SPAM', 'SCAM', 
    'EXPLICIT', 'MISINFORMATION', 'PRIVACY_VIOLATION', 'OTHER'
  ]),
  explanation: z.string().max(1000).optional()
});

export const appealSchema = z.object({
  postId: uuidSchema.optional(),
  reason: z.string().min(10, { message: "Please provide a detailed reason for the appeal" }).max(2000)
});

export const reviewAppealSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().max(1000).optional()
});

// --- Message Schemas ---
export const messageSchema = z.object({
  receiverIdentityId: uuidSchema,
  content: z.string().min(1, { message: "Message cannot be empty" }).max(2000)
});

export const recipientSearchSchema = z.object({
  search: z.string().max(100).optional()
});

// --- Debate & Features Schemas ---
export const createDebateSchema = z.object({
  topic: z.string().min(5, { message: "Debate topic must be at least 5 characters" }).max(250),
  sideA: z.string().min(2, { message: "Side A label is required" }).max(100),
  sideB: z.string().min(2, { message: "Side B label is required" }).max(100),
  durationDays: z.coerce.number().int().min(1).max(30).optional().default(7)
});

export const voteDebateSchema = z.object({
  side: z.enum(['SIDE_A', 'SIDE_B'])
});

export const mindChangeSchema = z.object({
  debateId: uuidSchema,
  fromSide: z.enum(['SIDE_A', 'SIDE_B']),
  toSide: z.enum(['SIDE_A', 'SIDE_B']),
  reason: z.string().max(1000).optional()
});

export const respondThoughtSchema = z.object({
  content: z.string().min(1, { message: "Response cannot be empty" }).max(1000)
});

export const voteIdeaSchema = z.object({
  option: z.enum(['A', 'B'])
});

// --- Argument Quality Schema ---
export const qualityVoteSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT']).default('POST'),
  targetId: uuidSchema,
  qualityTag: z.enum(['WELL_EXPLAINED', 'EVIDENCE_PROVIDED', 'RESPECTFUL', 'USEFUL_PERSPECTIVE'])
});

// --- Admin & Moderation Schemas ---
export const updateUserSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'FLAGGED']).optional(),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']).optional()
});

export const createTopicSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, { message: "Invalid topic slug format" }),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(30).optional().nullable()
});

export const moderationActionSchema = z.object({
  actionType: z.enum(['REMOVE', 'APPROVE', 'WARN', 'SUSPEND', 'DISMISS']),
  notes: z.string().max(1000).optional()
});

// --- AI Service Schemas ---
export const predictContentSchema = z.object({
  content: z.string().max(20000).optional().default(''),
  title: z.string().max(250).optional().default('')
}).refine(data => (data.content && data.content.trim().length > 0) || (data.title && data.title.trim().length > 0), {
  message: "Either content or title is required."
});

export const chatAssistantSchema = z.object({
  message: z.string().min(1, { message: "Message is required" }).max(3000),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(5000)
  })).max(30).optional()
});
