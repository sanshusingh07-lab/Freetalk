import { prisma } from '../config/db.js';

const VALID_TAGS = ['WELL_EXPLAINED', 'EVIDENCE_PROVIDED', 'RESPECTFUL', 'USEFUL_PERSPECTIVE'];

/**
 * Feature 13: Argument Quality Score — NOT Popularity Score
 * Users reward arguments for quality: Well explained, Evidence provided, Respectful, Useful perspective
 */
export async function voteArgumentQuality(req, res, next) {
  try {
    const { targetType, targetId, qualityTag } = req.body;
    const userId = req.user.id;

    if (!VALID_TAGS.includes(qualityTag)) {
      return res.status(400).json({
        success: false,
        message: `Invalid quality tag. Must be one of: ${VALID_TAGS.join(', ')}`
      });
    }

    if (targetType === 'POST') {
      const existing = await prisma.argumentQualityVote.findFirst({
        where: { userId, postId: targetId, qualityTag }
      });

      if (existing) {
        // Toggle remove
        await prisma.argumentQualityVote.delete({ where: { id: existing.id } });
      } else {
        // Add vote
        await prisma.argumentQualityVote.create({
          data: { userId, postId: targetId, qualityTag }
        });
      }

      // Fetch updated tallies
      const allVotes = await prisma.argumentQualityVote.findMany({
        where: { postId: targetId }
      });

      const counts = {
        WELL_EXPLAINED: 0,
        EVIDENCE_PROVIDED: 0,
        RESPECTFUL: 0,
        USEFUL_PERSPECTIVE: 0
      };
      const userVotedTags = [];

      allVotes.forEach(v => {
        if (counts[v.qualityTag] !== undefined) counts[v.qualityTag]++;
        if (v.userId === userId) userVotedTags.push(v.qualityTag);
      });

      const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);

      return res.status(200).json({
        success: true,
        message: existing ? "Quality badge removed." : "Quality tag awarded to argument!",
        quality: {
          ...counts,
          totalVotes,
          isHighQuality: totalVotes >= 2,
          userVotedTags
        }
      });
    } else {
      // COMMENT
      const existing = await prisma.argumentQualityVote.findFirst({
        where: { userId, commentId: targetId, qualityTag }
      });

      if (existing) {
        await prisma.argumentQualityVote.delete({ where: { id: existing.id } });
      } else {
        await prisma.argumentQualityVote.create({
          data: { userId, commentId: targetId, qualityTag }
        });
      }

      const allVotes = await prisma.argumentQualityVote.findMany({
        where: { commentId: targetId }
      });

      const counts = {
        WELL_EXPLAINED: 0,
        EVIDENCE_PROVIDED: 0,
        RESPECTFUL: 0,
        USEFUL_PERSPECTIVE: 0
      };
      const userVotedTags = [];

      allVotes.forEach(v => {
        if (counts[v.qualityTag] !== undefined) counts[v.qualityTag]++;
        if (v.userId === userId) userVotedTags.push(v.qualityTag);
      });

      const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);

      return res.status(200).json({
        success: true,
        message: existing ? "Quality badge removed." : "Quality tag awarded to comment argument!",
        quality: {
          ...counts,
          totalVotes,
          isHighQuality: totalVotes >= 2,
          userVotedTags
        }
      });
    }
  } catch (err) {
    next(err);
  }
}
