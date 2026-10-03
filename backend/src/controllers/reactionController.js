import { prisma } from '../config/db.js';
import { calculateTrendingScore } from '../services/trendingService.js';
import { emitToPost } from '../services/socketService.js';

export async function togglePostReaction(req, res, next) {
  try {
    const { id: postId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user.id;

    const validTypes = ['AGREE', 'INSIGHTFUL', 'THOUGHT_PROVOKING', 'FUNNY', 'STRONG_POINT'];
    if (!validTypes.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reaction type."
      });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ success: false, message: "Discussion not found." });
    }

    const existing = await prisma.reaction.findUnique({
      where: {
        userId_postId_reactionType: {
          userId,
          postId,
          reactionType
        }
      }
    });

    let action;
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      await prisma.post.update({
        where: { id: postId },
        data: { score: { decrement: 1 } }
      });
      action = 'REMOVED';
    } else {
      await prisma.reaction.create({
        data: { userId, postId, reactionType }
      });
      await prisma.post.update({
        where: { id: postId },
        data: { score: { increment: 1 } }
      });
      action = 'ADDED';
    }

    // Refresh counts and trending score
    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        reactions: true,
        _count: { select: { comments: true, reactions: true } }
      }
    });

    const trendingScore = calculateTrendingScore(updatedPost);
    await prisma.post.update({
      where: { id: postId },
      data: { trendingScore }
    });

    const reactionCounts = {
      AGREE: 0,
      INSIGHTFUL: 0,
      THOUGHT_PROVOKING: 0,
      FUNNY: 0,
      STRONG_POINT: 0
    };
    updatedPost.reactions.forEach(r => {
      if (reactionCounts[r.reactionType] !== undefined) {
        reactionCounts[r.reactionType]++;
      }
    });

    const userReactions = updatedPost.reactions
      .filter(r => r.userId === userId)
      .map(r => r.reactionType);

    // Emit live reaction to post room
    emitToPost(postId, 'post:reaction_updated', {
      postId,
      reactionCounts,
      totalScore: updatedPost.score
    });

    return res.status(200).json({
      success: true,
      action,
      reactionCounts,
      userReactions,
      totalScore: updatedPost.score
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleCommentReaction(req, res, next) {
  try {
    const { id: commentId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user.id;

    const validTypes = ['AGREE', 'INSIGHTFUL', 'THOUGHT_PROVOKING', 'FUNNY', 'STRONG_POINT'];
    if (!validTypes.includes(reactionType)) {
      return res.status(400).json({ success: false, message: "Invalid reaction type." });
    }

    const existing = await prisma.reaction.findUnique({
      where: {
        userId_commentId_reactionType: {
          userId,
          commentId,
          reactionType
        }
      }
    });

    let action;
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      action = 'REMOVED';
    } else {
      await prisma.reaction.create({
        data: { userId, commentId, reactionType }
      });
      action = 'ADDED';
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { reactions: true }
    });

    const reactionCounts = {
      AGREE: 0,
      INSIGHTFUL: 0,
      THOUGHT_PROVOKING: 0,
      FUNNY: 0,
      STRONG_POINT: 0
    };
    comment.reactions.forEach(r => {
      if (reactionCounts[r.reactionType] !== undefined) {
        reactionCounts[r.reactionType]++;
      }
    });

    const userReactions = comment.reactions
      .filter(r => r.userId === userId)
      .map(r => r.reactionType);

    return res.status(200).json({
      success: true,
      action,
      reactionCounts,
      userReactions
    });
  } catch (err) {
    next(err);
  }
}
