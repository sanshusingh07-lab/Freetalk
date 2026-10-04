import { prisma } from '../config/db.js';
import { commentSchema } from '../validators/index.js';
import { analyzeContentWithAI } from '../services/aiModerator.js';
import { calculateTrendingScore } from '../services/trendingService.js';
import { serializePublicIdentity } from '../utils/safeUserSerializer.js';
import { emitToPost, emitToUser } from '../services/socketService.js';

export async function getCommentsByPost(req, res, next) {
  try {
    const { postId } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        status: 'PUBLISHED'
      },
      include: {
        identity: true,
        reactions: true,
        argumentQualityVotes: true,
        _count: {
          select: { reactions: true, replies: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Format comments with safe serialized identities
    const formatted = comments.map(c => {
      const userReactions = req.user 
        ? c.reactions.filter(r => r.userId === req.user.id).map(r => r.reactionType)
        : [];

      const reactionCounts = {
        AGREE: 0,
        INSIGHTFUL: 0,
        THOUGHT_PROVOKING: 0,
        FUNNY: 0,
        STRONG_POINT: 0
      };
      c.reactions.forEach(r => {
        if (reactionCounts[r.reactionType] !== undefined) {
          reactionCounts[r.reactionType]++;
        }
      });

      // Argument Quality (Feature 13)
      const qualityCounts = {
        WELL_EXPLAINED: 0,
        EVIDENCE_PROVIDED: 0,
        RESPECTFUL: 0,
        USEFUL_PERSPECTIVE: 0
      };
      const userQualityVotes = [];
      if (c.argumentQualityVotes) {
        c.argumentQualityVotes.forEach(q => {
          if (qualityCounts[q.qualityTag] !== undefined) {
            qualityCounts[q.qualityTag]++;
          }
          if (req.user && q.userId === req.user.id) {
            userQualityVotes.push(q.qualityTag);
          }
        });
      }
      const totalQualityVotes = Object.values(qualityCounts).reduce((a, b) => a + b, 0);

      return {
        id: c.id,
        content: c.content,
        parentId: c.parentId,
        createdAt: c.createdAt,
        reactionsCount: c._count.reactions,
        repliesCount: c._count.replies,
        reactionCounts,
        userReactions,
        isAuthor: req.user ? req.user.id === c.userId : false,
        canDelete: req.user ? (req.user.id === c.userId || ['ADMIN', 'MODERATOR'].includes(req.user.role)) : false,
        identity: serializePublicIdentity(c.identity),
        challengeType: c.challengeType || null,
        argumentQuality: {
          ...qualityCounts,
          totalVotes: totalQualityVotes,
          isHighQuality: totalQualityVotes >= 2,
          userVotedTags: userQualityVotes
        }
      };
    });

    // Build threaded tree structure
    const commentMap = {};
    const rootComments = [];

    formatted.forEach(c => {
      c.replies = [];
      commentMap[c.id] = c;
    });

    formatted.forEach(c => {
      if (c.parentId && commentMap[c.parentId]) {
        commentMap[c.parentId].replies.push(c);
      } else {
        rootComments.push(c);
      }
    });

    return res.status(200).json({
      success: true,
      comments: rootComments,
      totalCount: formatted.length
    });
  } catch (err) {
    next(err);
  }
}

export async function createComment(req, res, next) {
  try {
    const { postId } = req.params;
    const validated = commentSchema.parse(req.body);
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post || post.status !== 'PUBLISHED') {
      return res.status(404).json({
        success: false,
        message: "Discussion not found or closed for discussion."
      });
    }

    if (!post.allowComments) {
      return res.status(400).json({
        success: false,
        message: "Comments are disabled for this discussion."
      });
    }

    // Feature 6: Slow Mode Rate Limiting Enforcement
    if (post.slowMode) {
      const lastComment = await prisma.comment.findFirst({
        where: { postId, userId },
        orderBy: { createdAt: 'desc' }
      });
      if (lastComment) {
        const cooldown = post.slowModeSeconds || 30;
        const elapsed = Math.floor((Date.now() - new Date(lastComment.createdAt).getTime()) / 1000);
        if (elapsed < cooldown) {
          return res.status(429).json({
            success: false,
            message: `🐢 Slow discussion mode is active. Please wait ${cooldown - elapsed}s before replying again.`,
            code: "SLOW_MODE_COOLDOWN",
            retryAfterSeconds: cooldown - elapsed
          });
        }
      }
    }

    // In-built AI Moderation check
    const moderation = await analyzeContentWithAI(validated.content, null, 'comment');
    if (moderation.instantAction === 'BLOCKED' || (moderation.detectedBadwords && moderation.detectedBadwords.length > 0)) {
      return res.status(400).json({
        success: false,
        message: `Prohibited content detected. In-built AI filter blocked this reply due to: ${moderation.blockReason || moderation.detectedBadwords.join(', ')}.`,
        code: "PROHIBITED_CONTENT",
        detectedBadwords: moderation.detectedBadwords,
        negativityScore: moderation.negativityScore
      });
    }

    const identity = req.activeIdentity;

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content: validated.content,
          parentId: validated.parentId || null,
          challengeType: validated.challengeType || null,
          postId,
          userId,
          identityId: identity.id,
          status: 'PUBLISHED'
        },
        include: { identity: true }
      });

      // Update post activity timestamp and score
      const fullPost = await tx.post.findUnique({
        where: { id: postId },
        include: {
          _count: { select: { comments: true, reactions: true } }
        }
      });

      const trendingScore = calculateTrendingScore(fullPost);
      await tx.post.update({
        where: { id: postId },
        data: {
          lastActivityAt: new Date(),
          trendingScore
        }
      });

      // Notification for post author if not self
      if (post.userId !== userId) {
        await tx.notification.create({
          data: {
            userId: post.userId,
            type: 'REPLY',
            title: 'New discussion reply',
            content: `${identity.displayName} responded to your discussion.`,
            link: `/post/${postId}`,
            referenceId: newComment.id
          }
        });
      }

      // If reply to a parent comment, notify parent author if not self
      if (validated.parentId) {
        const parentComment = await tx.comment.findUnique({
          where: { id: validated.parentId }
        });
        if (parentComment && parentComment.userId !== userId && parentComment.userId !== post.userId) {
          await tx.notification.create({
            data: {
              userId: parentComment.userId,
              type: 'REPLY',
              title: 'Reply to your thought',
              content: `${identity.displayName} replied directly to your point.`,
              link: `/post/${postId}`,
              referenceId: newComment.id
            }
          });
        }
      }

      return newComment;
    });

    const safeComment = {
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      reactionsCount: 0,
      repliesCount: 0,
      reactionCounts: { AGREE: 0, INSIGHTFUL: 0, THOUGHT_PROVOKING: 0, FUNNY: 0, STRONG_POINT: 0 },
      userReactions: [],
      isAuthor: true,
      canDelete: true,
      identity: serializePublicIdentity(comment.identity),
      replies: []
    };

    // Emit live comment to post room
    emitToPost(postId, 'comment:new', safeComment);

    // If notifying post author, emit real-time notification
    if (post.userId !== userId) {
      emitToUser(post.userId, 'notification:new', {
        title: 'New discussion reply',
        content: `${identity.displayName} responded to your discussion.`,
        link: `/post/${postId}`
      });
    }

    return res.status(201).json({
      success: true,
      comment: safeComment
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found." });
    }

    const isAuthor = comment.userId === req.user.id;
    const isStaff = ['ADMIN', 'MODERATOR'].includes(req.user.role);

    if (!isAuthor && !isStaff) {
      return res.status(403).json({ success: false, message: "Permission denied." });
    }

    await prisma.comment.delete({ where: { id } });

    // Emit live deletion event to post room
    emitToPost(comment.postId, 'comment:deleted', { commentId: id, postId: comment.postId });

    return res.status(200).json({
      success: true,
      message: "Comment removed successfully."
    });
  } catch (err) {
    next(err);
  }
}
