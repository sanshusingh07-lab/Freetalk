import { prisma } from '../config/db.js';
import { reportSchema } from '../validators/index.js';
import { emitToModerators } from '../services/socketService.js';

export async function createReport(req, res, next) {
  try {
    const validated = reportSchema.parse(req.body);
    const reporterUserId = req.user.id;

    const data = {
      reporterUserId,
      reason: validated.reason,
      explanation: validated.explanation || null,
      targetType: validated.targetType,
      status: 'PENDING'
    };

    if (validated.targetType === 'POST') {
      data.postId = validated.targetId;
    } else if (validated.targetType === 'COMMENT') {
      data.commentId = validated.targetId;
    } else if (validated.targetType === 'MESSAGE') {
      data.messageId = validated.targetId;
    }

    const report = await prisma.report.create({
      data,
      include: {
        post: true,
        comment: true
      }
    });

    // Alert moderators in real-time
    emitToModerators('moderation:new_report', {
      reportId: report.id,
      targetType: report.targetType,
      reason: report.reason
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted. Thank you for keeping FreeTalk safe and constructive."
    });
  } catch (err) {
    next(err);
  }
}
