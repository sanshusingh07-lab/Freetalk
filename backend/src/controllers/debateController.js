import { prisma } from '../config/db.js';
import { serializePublicIdentity } from '../utils/safeUserSerializer.js';
import { generateAnonymousIdentity } from '../utils/identityGenerator.js';

// === THOUGHT OF THE DAY ===
export async function getActiveThought(req, res, next) {
  try {
    const thought = await prisma.thoughtOfDay.findFirst({
      where: { isActive: true },
      include: {
        responses: {
          include: { identity: true },
          orderBy: { upvotes: 'desc' },
          take: 20
        }
      },
      orderBy: { activeDate: 'desc' }
    });

    if (!thought) {
      return res.status(200).json({ success: true, thought: null });
    }

    const formattedResponses = thought.responses.map(r => ({
      id: r.id,
      content: r.content,
      upvotes: r.upvotes,
      createdAt: r.createdAt,
      identity: serializePublicIdentity(r.identity)
    }));

    return res.status(200).json({
      success: true,
      thought: {
        id: thought.id,
        prompt: thought.prompt,
        category: thought.category,
        responses: formattedResponses
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function respondToThought(req, res, next) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const identity = req.activeIdentity;

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ success: false, message: "Response must be at least 5 characters." });
    }

    const response = await prisma.thoughtResponse.create({
      data: {
        thoughtId: id,
        userId,
        identityId: identity.id,
        content: content.trim()
      },
      include: { identity: true }
    });

    return res.status(201).json({
      success: true,
      response: {
        id: response.id,
        content: response.content,
        upvotes: response.upvotes,
        createdAt: response.createdAt,
        identity: serializePublicIdentity(response.identity)
      }
    });
  } catch (err) {
    next(err);
  }
}

// === BLIND DEBATE ===
export async function getDebates(req, res, next) {
  try {
    const debates = await prisma.blindDebate.findMany({
      include: {
        votes: req.user ? { where: { userId: req.user.id } } : false,
        mindChangeVotes: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = debates.map(d => {
      const userVotedSide = d.votes?.[0]?.side || null;

      const mindStats = {
        YES: 0,
        A_LITTLE: 0,
        NO: 0,
        STILL_THINKING: 0,
        totalVotes: 0,
        userVoted: null
      };

      if (d.mindChangeVotes) {
        d.mindChangeVotes.forEach(v => {
          if (mindStats[v.opinionChange] !== undefined) {
            mindStats[v.opinionChange]++;
            mindStats.totalVotes++;
          }
          if (req.user && v.userId === req.user.id) {
            mindStats.userVoted = v.opinionChange;
          }
        });
      }

      return {
        id: d.id,
        topic: d.topic,
        category: d.category,
        sideATitle: d.sideATitle,
        sideAContent: d.sideAContent,
        sideBTitle: d.sideBTitle,
        sideBContent: d.sideBContent,
        sideAAuthorAlias: d.sideAAuthorAlias || "🅰️ Anonymous Raven",
        sideBAuthorAlias: d.sideBAuthorAlias || "🅱️ Anonymous Fox",
        votesA: d.votesA,
        votesB: d.votesB,
        userVotedSide,
        status: d.status,
        mindChangeStats: mindStats
      };
    });

    return res.status(200).json({
      success: true,
      debates: formatted
    });
  } catch (err) {
    next(err);
  }
}

export async function voteDebate(req, res, next) {
  try {
    const { id } = req.params;
    const { side } = req.body; // "A" or "B"
    const userId = req.user.id;

    if (!['A', 'B'].includes(side)) {
      return res.status(400).json({ success: false, message: "Invalid side. Must be A or B." });
    }

    const existingVote = await prisma.debateVote.findUnique({
      where: {
        debateId_userId: { debateId: id, userId }
      }
    });

    if (existingVote) {
      return res.status(400).json({ success: false, message: "You have already voted on this debate." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.debateVote.create({
        data: { debateId: id, userId, side }
      });

      if (side === 'A') {
        await tx.blindDebate.update({
          where: { id },
          data: { votesA: { increment: 1 } }
        });
      } else {
        await tx.blindDebate.update({
          where: { id },
          data: { votesB: { increment: 1 } }
        });
      }
    });

    const updated = await prisma.blindDebate.findUnique({ where: { id } });

    return res.status(200).json({
      success: true,
      message: `Vote recorded for Argument ${side}.`,
      votesA: updated.votesA,
      votesB: updated.votesB,
      userVotedSide: side
    });
  } catch (err) {
    next(err);
  }
}

// === IDEA VS IDEA ===
export async function getIdeas(req, res, next) {
  try {
    const ideas = await prisma.ideaVsIdea.findMany({
      include: {
        votes: req.user ? { where: { userId: req.user.id } } : false
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = ideas.map(i => {
      const userVotedOption = i.votes?.[0]?.option || null;
      return {
        id: i.id,
        title: i.title,
        description: i.description,
        optionATitle: i.optionATitle,
        optionADesc: i.optionADesc,
        optionBTitle: i.optionBTitle,
        optionBDesc: i.optionBDesc,
        votesA: i.votesA,
        votesB: i.votesB,
        userVotedOption
      };
    });

    return res.status(200).json({
      success: true,
      ideas: formatted
    });
  } catch (err) {
    next(err);
  }
}

export async function voteIdea(req, res, next) {
  try {
    const { id } = req.params;
    const { option } = req.body; // "A" or "B"
    const userId = req.user.id;

    if (!['A', 'B'].includes(option)) {
      return res.status(400).json({ success: false, message: "Invalid option." });
    }

    const existingVote = await prisma.ideaVote.findUnique({
      where: {
        ideaId_userId: { ideaId: id, userId }
      }
    });

    if (existingVote) {
      return res.status(400).json({ success: false, message: "You have already voted on this comparison." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.ideaVote.create({
        data: { ideaId: id, userId, option }
      });

      if (option === 'A') {
        await tx.ideaVsIdea.update({
          where: { id },
          data: { votesA: { increment: 1 } }
        });
      } else {
        await tx.ideaVsIdea.update({
          where: { id },
          data: { votesB: { increment: 1 } }
        });
      }
    });

    const updated = await prisma.ideaVsIdea.findUnique({ where: { id } });

    return res.status(200).json({
      success: true,
      message: `Vote recorded for Option ${option}.`,
      votesA: updated.votesA,
      votesB: updated.votesB,
      userVotedOption: option
    });
  } catch (err) {
    next(err);
  }
}

// === CREATE BLIND DEBATE (Feature 1) ===
export async function createDebate(req, res, next) {
  try {
    const { topic, category, sideATitle, sideAContent, sideBTitle, sideBContent } = req.body;

    if (!topic || !sideATitle || !sideAContent || !sideBTitle || !sideBContent) {
      return res.status(400).json({ success: false, message: "All debate fields are required." });
    }

    const aliasA = "🅰️ " + generateAnonymousIdentity().displayName;
    const aliasB = "🅱️ " + generateAnonymousIdentity().displayName;

    const debate = await prisma.blindDebate.create({
      data: {
        topic: topic.trim(),
        category: category || "Ethics & Tech",
        sideATitle: sideATitle.trim(),
        sideAContent: sideAContent.trim(),
        sideBTitle: sideBTitle.trim(),
        sideBContent: sideBContent.trim(),
        sideAAuthorAlias: aliasA,
        sideBAuthorAlias: aliasB,
        status: "ACTIVE"
      }
    });

    return res.status(201).json({
      success: true,
      debate
    });
  } catch (err) {
    next(err);
  }
}

// === "WHAT CHANGED MY MIND?" (Feature 12) ===
export async function voteMindChange(req, res, next) {
  try {
    const { targetType, targetId, opinionChange } = req.body; // targetType: 'POST' or 'DEBATE', opinionChange: 'YES'|'A_LITTLE'|'NO'|'STILL_THINKING'
    const userId = req.user.id;

    if (!['YES', 'A_LITTLE', 'NO', 'STILL_THINKING'].includes(opinionChange)) {
      return res.status(400).json({ success: false, message: "Invalid opinion change value." });
    }

    if (targetType === 'DEBATE') {
      const existing = await prisma.mindChangeVote.findFirst({
        where: { userId, debateId: targetId }
      });
      if (existing) {
        await prisma.mindChangeVote.update({
          where: { id: existing.id },
          data: { opinionChange }
        });
      } else {
        await prisma.mindChangeVote.create({
          data: { userId, debateId: targetId, opinionChange }
        });
      }
    } else {
      const existing = await prisma.mindChangeVote.findFirst({
        where: { userId, postId: targetId }
      });
      if (existing) {
        await prisma.mindChangeVote.update({
          where: { id: existing.id },
          data: { opinionChange }
        });
      } else {
        await prisma.mindChangeVote.create({
          data: { userId, postId: targetId, opinionChange }
        });
      }
    }

    // Return updated aggregated statistics
    const allVotes = await prisma.mindChangeVote.findMany({
      where: targetType === 'DEBATE' ? { debateId: targetId } : { postId: targetId }
    });

    const stats = {
      YES: 0,
      A_LITTLE: 0,
      NO: 0,
      STILL_THINKING: 0,
      totalVotes: allVotes.length,
      userVoted: opinionChange
    };

    allVotes.forEach(v => {
      if (stats[v.opinionChange] !== undefined) {
        stats[v.opinionChange]++;
      }
    });

    return res.status(200).json({
      success: true,
      message: "Opinion shift recorded anonymously.",
      stats
    });
  } catch (err) {
    next(err);
  }
}

// === "RANDOM CONVERSATION" (Feature 14) ===
const CURATED_RANDOM_TOPICS = [
  {
    question: "Would you rather know your future or change your past?",
    category: "Philosophy & Time",
    premise: "Consider the psychological toll of predestination versus the unintended butterfly effects of alteration."
  },
  {
    question: "Is true altruism possible, or are all selfless acts motivated by internal fulfillment?",
    category: "Ethics & Human Nature",
    premise: "When we help others, do we act purely for their well-being, or to preserve our moral self-concept?"
  },
  {
    question: "Will full remote work create greater social equality or deeper professional alienation?",
    category: "Future of Work",
    premise: "Location independence democratizes hiring, yet reduces serendipitous mentorship and organic team bonding."
  },
  {
    question: "Should AI systems ever be granted legal personhood or rights?",
    category: "Artificial Intelligence",
    premise: "If an autonomous synthetic entity demonstrates subjective reasoning, where does tool end and rights begin?"
  },
  {
    question: "Does total privacy protect freedom, or make societal accountability impossible?",
    category: "Privacy & Society",
    premise: "Anonymity shields dissidents and contrarians, but complicates consequence management."
  }
];

export async function getRandomPrompt(req, res, next) {
  try {
    // Pick random from database post or curated prompts
    const postCount = await prisma.post.count({ where: { status: 'PUBLISHED' } });
    if (postCount > 0 && Math.random() > 0.4) {
      const skip = Math.floor(Math.random() * postCount);
      const post = await prisma.post.findFirst({
        where: { status: 'PUBLISHED' },
        skip,
        include: { topic: true }
      });
      if (post) {
        return res.status(200).json({
          success: true,
          type: "POST",
          prompt: {
            id: post.id,
            question: post.title,
            premise: post.content,
            category: post.topic.name,
            postId: post.id
          }
        });
      }
    }

    const randomPick = CURATED_RANDOM_TOPICS[Math.floor(Math.random() * CURATED_RANDOM_TOPICS.length)];
    return res.status(200).json({
      success: true,
      type: "CURATED",
      prompt: randomPick
    });
  } catch (err) {
    next(err);
  }
}

