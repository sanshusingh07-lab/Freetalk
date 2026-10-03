import { prisma } from '../config/db.js';
import { emitToUser } from '../services/socketService.js';

export async function getModerationQueue(req, res, next) {
  try {
    const reports = await prisma.report.findMany({
      where: { status: 'PENDING' },
      include: {
        post: {
          include: {
            identity: true,
            moderationResult: true
          }
        },
        comment: {
          include: {
            identity: true,
            moderationResult: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = reports.map(r => {
      const target = r.post || r.comment;
      const modResult = target?.moderationResult;

      return {
        id: r.id,
        reason: r.reason,
        explanation: r.explanation,
        targetType: r.targetType,
        createdAt: r.createdAt,
        content: target ? (target.content || target.title) : "Content deleted",
        title: target?.title || null,
        targetId: r.postId || r.commentId,
        authorIdentityName: target?.identity?.displayName || "Anonymous",
        aiMetrics: {
          toxicityScore: modResult?.toxicityScore || 0,
          harassmentScore: modResult?.harassmentScore || 0,
          spamScore: modResult?.spamScore || 0,
          threatScore: modResult?.threatScore || 0,
          riskLevel: modResult?.riskLevel || 'LOW',
          flaggedKeywords: modResult?.flaggedKeywords || []
        }
      };
    });

    return res.status(200).json({
      success: true,
      queue: formatted,
      count: formatted.length
    });
  } catch (err) {
    next(err);
  }
}

export async function takeModerationAction(req, res, next) {
  try {
    const { id: reportId } = req.params;
    const { actionType, notes } = req.body;
    const moderatorUserId = req.user.id;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { post: true, comment: true }
    });

    if (!report) {
      return res.status(404).json({ success: false, message: "Report item not found." });
    }

    const target = report.post || report.comment;
    const targetUserId = target?.userId;

    await prisma.$transaction(async (tx) => {
      // Record moderation action
      await tx.moderationAction.create({
        data: {
          reportId,
          moderatorUserId,
          actionType,
          notes
        }
      });

      // Update report status
      await tx.report.update({
        where: { id: reportId },
        data: { status: actionType === 'DISMISS' ? 'DISMISSED' : 'ACTIONED' }
      });

      // Apply action on content/user
      if (actionType === 'REMOVE') {
        if (report.postId) {
          await tx.post.update({
            where: { id: report.postId },
            data: { status: 'REMOVED' }
          });
        } else if (report.commentId) {
          await tx.comment.update({
            where: { id: report.commentId },
            data: { status: 'REMOVED' }
          });
        }

        if (targetUserId) {
          await tx.notification.create({
            data: {
              userId: targetUserId,
              type: 'MODERATION',
              title: 'Content removed by moderation',
              content: `Your ${report.targetType.toLowerCase()} was removed for violating Community Guidelines (${report.reason}). You may file an appeal.`,
              link: '/activity'
            }
          });

          emitToUser(targetUserId, 'notification:new', {
            title: 'Content removed by moderation',
            content: `Your ${report.targetType.toLowerCase()} was removed for violating Community Guidelines.`
          });
        }
      } else if (actionType === 'APPROVE') {
        if (report.postId) {
          await tx.post.update({
            where: { id: report.postId },
            data: { status: 'PUBLISHED' }
          });
        }
      } else if (actionType === 'WARN' && targetUserId) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            type: 'MODERATION',
            title: 'Community Guidelines Warning',
            content: `Notice regarding your recent discussion: ${notes || "Please keep debates constructive and avoid personal attacks."}`,
            link: '/activity'
          }
        });
      } else if (actionType === 'SUSPEND' && targetUserId) {
        await tx.user.update({
          where: { id: targetUserId },
          data: { status: 'SUSPENDED' }
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: `Moderation action (${actionType}) applied successfully.`
    });
  } catch (err) {
    next(err);
  }
}
