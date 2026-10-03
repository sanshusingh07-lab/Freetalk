import { prisma } from '../config/db.js';
import { appealSchema } from '../validators/index.js';
import { emitToUser } from '../services/socketService.js';

export async function createAppeal(req, res, next) {
  try {
    const validated = appealSchema.parse(req.body);
    const userId = req.user.id;

    const appeal = await prisma.appeal.create({
      data: {
        postId: validated.postId || null,
        userId,
        reason: validated.reason,
        status: 'PENDING'
      }
    });

    return res.status(201).json({
      success: true,
      message: "Your appeal has been submitted for secondary review.",
      appeal
    });
  } catch (err) {
    next(err);
  }
}

export async function getAppeals(req, res, next) {
  try {
    const appeals = await prisma.appeal.findMany({
      where: { status: 'PENDING' },
      include: {
        post: {
          include: { identity: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = appeals.map(a => ({
      id: a.id,
      reason: a.reason,
      createdAt: a.createdAt,
      status: a.status,
      post: a.post ? {
        id: a.post.id,
        title: a.post.title,
        content: a.post.content,
        authorIdentityName: a.post.identity.displayName
      } : null
    }));

    return res.status(200).json({
      success: true,
      appeals: formatted
    });
  } catch (err) {
    next(err);
  }
}

export async function reviewAppeal(req, res, next) {
  try {
    const { id: appealId } = req.params;
    const { status, reviewNotes } = req.body; // 'APPROVED' or 'REJECTED'

    const appeal = await prisma.appeal.findUnique({
      where: { id: appealId }
    });

    if (!appeal) {
      return res.status(404).json({ success: false, message: "Appeal not found." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.appeal.update({
        where: { id: appealId },
        data: {
          status,
          reviewNotes
        }
      });

      if (status === 'APPROVED' && appeal.postId) {
        await tx.post.update({
          where: { id: appeal.postId },
          data: { status: 'PUBLISHED' }
        });
      }

      await tx.notification.create({
        data: {
          userId: appeal.userId,
          type: 'APPEAL',
          title: `Appeal ${status === 'APPROVED' ? 'Granted' : 'Declined'}`,
          content: status === 'APPROVED'
            ? 'Your appeal was approved and your discussion has been reinstated.'
            : `Your appeal was reviewed and declined. Reason: ${reviewNotes || 'Content remains in violation of guidelines.'}`,
          link: '/activity'
        }
      });

      emitToUser(appeal.userId, 'notification:new', {
        title: `Appeal ${status === 'APPROVED' ? 'Granted' : 'Declined'}`,
        content: status === 'APPROVED'
          ? 'Your discussion has been reinstated.'
          : 'Your appeal was declined.'
      });
    });

    return res.status(200).json({
      success: true,
      message: `Appeal marked as ${status}.`
    });
  } catch (err) {
    next(err);
  }
}
