import { prisma } from '../config/db.js';
import { pollSchema } from '../validators/index.js';
import { generateAnonymousIdentity } from '../utils/identityGenerator.js';
import { emitToPost } from '../services/socketService.js';

export async function createPoll(req, res, next) {
  try {
    const validated = pollSchema.parse(req.body);
    const userId = req.user.id;
    const identity = req.activeIdentity;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (validated.durationDays || 7));

    const result = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          title: validated.question,
          content: `Poll: ${validated.question}`,
          postType: 'POLL',
          status: 'PUBLISHED',
          userId,
          identityId: identity.id,
          topicId: validated.topicId
        }
      });

      const poll = await tx.poll.create({
        data: {
          postId: post.id,
          question: validated.question,
          expiresAt,
          options: {
            create: validated.options.map(text => ({ text }))
          }
        },
        include: { options: true }
      });

      await tx.topic.update({
        where: { id: validated.topicId },
        data: { postCount: { increment: 1 } }
      });

      return { post, poll };
    });

    return res.status(201).json({
      success: true,
      message: "Anonymous poll created.",
      poll: result.poll,
      postId: result.post.id
    });
  } catch (err) {
    next(err);
  }
}

export async function votePoll(req, res, next) {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    const userId = req.user.id;

    if (!optionId) {
      return res.status(400).json({ success: false, message: "Option ID is required." });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true }
    });

    if (!poll) {
      return res.status(404).json({ success: false, message: "Poll not found." });
    }

    if (poll.expiresAt && new Date() > new Date(poll.expiresAt)) {
      return res.status(400).json({ success: false, message: "This poll has concluded." });
    }

    const existingVote = await prisma.pollVote.findUnique({
      where: {
        userId_pollId: { userId, pollId }
      }
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: "You have already voted on this poll."
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.pollVote.create({
        data: {
          pollId,
          pollOptionId: optionId,
          userId
        }
      });

      await tx.pollOption.update({
        where: { id: optionId },
        data: { voteCount: { increment: 1 } }
      });

      await tx.poll.update({
        where: { id: pollId },
        data: { totalVotes: { increment: 1 } }
      });
    });

    const updatedPoll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true }
    });

    emitToPost(poll.postId, 'poll:updated', {
      pollId,
      totalVotes: updatedPoll.totalVotes,
      options: updatedPoll.options
    });

    return res.status(200).json({
      success: true,
      message: "Vote recorded anonymously.",
      poll: updatedPoll,
      userVotedOptionId: optionId
    });
  } catch (err) {
    next(err);
  }
}
