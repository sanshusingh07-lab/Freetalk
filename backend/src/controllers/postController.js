import { prisma } from '../config/db.js';
import { postSchema } from '../validators/index.js';
import { analyzeContentWithAI } from '../services/aiModerator.js';
import { generatePerspectivesForPost } from '../services/aiPerspectiveService.js';
import { calculateTrendingScore } from '../services/trendingService.js';
import { scorePostForUser } from '../services/recommendationService.js';
import { generateAnonymousIdentity } from '../utils/identityGenerator.js';
import { serializePublicIdentity } from '../utils/safeUserSerializer.js';
import { emitToModerators, getIO } from '../services/socketService.js';

export function calculateDiscussionTemperature(post, recentCommentsCount = 0, reportsCount = 0) {
  if (reportsCount >= 2 || recentCommentsCount >= 15) {
    return { level: 'HIGHLY_HEATED', label: '🔴 Highly Heated', badge: 'Highly Heated' };
  }
  if (reportsCount >= 1 || recentCommentsCount >= 7) {
    return { level: 'HEATED', label: '🟠 Heated', badge: 'Heated' };
  }
  const totalComments = post.commentsCount || (post._count && post._count.comments) || 0;
  if (recentCommentsCount >= 2 || totalComments >= 5) {
    return { level: 'ACTIVE', label: '🟡 Active', badge: 'Active' };
  }
  return { level: 'CALM', label: '🟢 Calm', badge: 'Calm' };
}

export async function getPosts(req, res, next) {
  try {
    const { 
      feed = 'explore', 
      topic, 
      search, 
      postType, 
      statementType,
      language,
      limit = 20, 
      offset = 0 
    } = req.query;

    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit)));
    const parsedOffset = Math.max(0, parseInt(offset));

    const whereClause = {
      status: 'PUBLISHED'
    };

    if (topic) {
      whereClause.topic = { slug: topic };
    }

    if (postType) {
      whereClause.postType = postType;
    }

    if (statementType) {
      whereClause.statementType = statementType;
    }

    if (language && language !== 'all') {
      whereClause.language = language;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { hashtags: { has: search.replace(/^#/, '').toLowerCase() } }
      ];
    }

    // Determine sorting
    let orderBy = { createdAt: 'desc' };
    if (feed === 'explore') {
      orderBy = { trendingScore: 'desc' };
    } else if (feed === 'top') {
      orderBy = { score: 'desc' };
    }

    let posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        identity: true,
        topic: true,
        poll: {
          include: {
            options: true,
            votes: req.user ? { where: { userId: req.user.id } } : false
          }
        },
        reactions: true,
        reports: { select: { id: true } },
        argumentQualityVotes: true,
        _count: {
          select: { comments: true, reactions: true, bookmarks: true }
        },
        bookmarks: req.user ? { where: { userId: req.user.id } } : false
      },
      orderBy,
      take: feed === 'home' ? 50 : parsedLimit,
      skip: feed === 'home' ? 0 : parsedOffset
    });

    // If personalized home feed, apply recommendation scoring
    if (feed === 'home' && req.user) {
      const userWithPrefs = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { followedTopics: true }
      });

      posts.sort((a, b) => {
        const scoreA = scorePostForUser(a, userWithPrefs);
        const scoreB = scorePostForUser(b, userWithPrefs);
        return scoreB - scoreA;
      });

      posts = posts.slice(parsedOffset, parsedOffset + parsedLimit);
    }

    // Format post results safely (never expose user IDs publicly)
    const formatted = posts.map(post => {
      const userReactions = req.user 
        ? post.reactions.filter(r => r.userId === req.user.id).map(r => r.reactionType)
        : [];
      
      const isBookmarked = Boolean(post.bookmarks && post.bookmarks.length > 0);
      const userVotedOptionId = post.poll?.votes?.[0]?.pollOptionId || null;

      // Group reactions counts
      const reactionCounts = {
        AGREE: 0,
        INSIGHTFUL: 0,
        THOUGHT_PROVOKING: 0,
        FUNNY: 0,
        STRONG_POINT: 0
      };
      post.reactions.forEach(r => {
        if (reactionCounts[r.reactionType] !== undefined) {
          reactionCounts[r.reactionType]++;
        }
      });

      // Calculate Argument Quality Score (Feature 13)
      const qualityCounts = {
        WELL_EXPLAINED: 0,
        EVIDENCE_PROVIDED: 0,
        RESPECTFUL: 0,
        USEFUL_PERSPECTIVE: 0
      };
      const userQualityVotes = [];
      if (post.argumentQualityVotes) {
        post.argumentQualityVotes.forEach(q => {
          if (qualityCounts[q.qualityTag] !== undefined) {
            qualityCounts[q.qualityTag]++;
          }
          if (req.user && q.userId === req.user.id) {
            userQualityVotes.push(q.qualityTag);
          }
        });
      }
      const totalQualityVotes = Object.values(qualityCounts).reduce((a, b) => a + b, 0);

      // Discussion Temperature (Feature 7)
      const temperature = calculateDiscussionTemperature(post, post._count?.comments || 0, post.reports?.length || 0);

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        mediaUrl: post.mediaUrl,
        postType: post.postType,
        hashtags: post.hashtags,
        createdAt: post.createdAt,
        allowComments: post.allowComments,
        commentsCount: post._count.comments,
        reactionsCount: post._count.reactions,
        bookmarksCount: post._count.bookmarks,
        reactionCounts,
        userReactions,
        isBookmarked,
        identity: serializePublicIdentity(post.identity),
        topic: post.topic,

        // 15 Feature Enhancements
        statementType: post.statementType || 'OPINION',
        isChallengeOpinion: Boolean(post.isChallengeOpinion),
        sourceUrl: post.sourceUrl,
        sourceTitle: post.sourceTitle,
        sourceType: post.sourceType,
        slowMode: Boolean(post.slowMode),
        slowModeSeconds: post.slowModeSeconds || 30,
        language: post.language || 'en',
        isPotentialScam: Boolean(post.isPotentialScam),
        scamReason: post.scamReason,
        temperature,
        argumentQuality: {
          ...qualityCounts,
          totalVotes: totalQualityVotes,
          isHighQuality: totalQualityVotes >= 2,
          userVotedTags: userQualityVotes
        },

        poll: post.poll ? {
          id: post.poll.id,
          question: post.poll.question,
          totalVotes: post.poll.totalVotes,
          expiresAt: post.poll.expiresAt,
          userVotedOptionId,
          options: post.poll.options.map(opt => ({
            id: opt.id,
            text: opt.text,
            voteCount: opt.voteCount
          }))
        } : null
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
      count: formatted.length,
      page: Math.floor(parsedOffset / parsedLimit) + 1
    });
  } catch (err) {
    next(err);
  }
}

export async function getPostById(req, res, next) {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        identity: true,
        topic: true,
        poll: {
          include: {
            options: true,
            votes: req.user ? { where: { userId: req.user.id } } : false
          }
        },
        reactions: true,
        reports: { select: { id: true } },
        argumentQualityVotes: true,
        mindChangeVotes: true,
        _count: {
          select: { comments: true, reactions: true, bookmarks: true }
        },
        bookmarks: req.user ? { where: { userId: req.user.id } } : false
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found or has been removed.",
        code: "POST_NOT_FOUND"
      });
    }

    // Increment views asynchronously
    await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } }
    }).catch(() => {});

    const userReactions = req.user 
      ? post.reactions.filter(r => r.userId === req.user.id).map(r => r.reactionType)
      : [];

    const isBookmarked = Boolean(post.bookmarks && post.bookmarks.length > 0);
    const userVotedOptionId = post.poll?.votes?.[0]?.pollOptionId || null;

    const reactionCounts = {
      AGREE: 0,
      INSIGHTFUL: 0,
      THOUGHT_PROVOKING: 0,
      FUNNY: 0,
      STRONG_POINT: 0
    };
    post.reactions.forEach(r => {
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
    if (post.argumentQualityVotes) {
      post.argumentQualityVotes.forEach(q => {
        if (qualityCounts[q.qualityTag] !== undefined) {
          qualityCounts[q.qualityTag]++;
        }
        if (req.user && q.userId === req.user.id) {
          userQualityVotes.push(q.qualityTag);
        }
      });
    }
    const totalQualityVotes = Object.values(qualityCounts).reduce((a, b) => a + b, 0);

    // Mind Change Stats (Feature 12)
    const mindStats = {
      YES: 0,
      A_LITTLE: 0,
      NO: 0,
      STILL_THINKING: 0,
      totalVotes: 0,
      userVoted: null
    };
    if (post.mindChangeVotes) {
      post.mindChangeVotes.forEach(v => {
        if (mindStats[v.opinionChange] !== undefined) {
          mindStats[v.opinionChange]++;
          mindStats.totalVotes++;
        }
        if (req.user && v.userId === req.user.id) {
          mindStats.userVoted = v.opinionChange;
        }
      });
    }

    // Discussion Temperature (Feature 7)
    const temperature = calculateDiscussionTemperature(post, post._count?.comments || 0, post.reports?.length || 0);

    return res.status(200).json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        mediaUrl: post.mediaUrl,
        postType: post.postType,
        hashtags: post.hashtags,
        createdAt: post.createdAt,
        allowComments: post.allowComments,
        commentsCount: post._count.comments,
        reactionsCount: post._count.reactions,
        bookmarksCount: post._count.bookmarks,
        reactionCounts,
        userReactions,
        isBookmarked,
        isAuthor: req.user ? req.user.id === post.userId : false,
        identity: serializePublicIdentity(post.identity),
        topic: post.topic,

        // 15 Feature Fields
        statementType: post.statementType || 'OPINION',
        isChallengeOpinion: Boolean(post.isChallengeOpinion),
        sourceUrl: post.sourceUrl,
        sourceTitle: post.sourceTitle,
        sourceType: post.sourceType,
        slowMode: Boolean(post.slowMode),
        slowModeSeconds: post.slowModeSeconds || 30,
        language: post.language || 'en',
        isPotentialScam: Boolean(post.isPotentialScam),
        scamReason: post.scamReason,
        temperature,
        argumentQuality: {
          ...qualityCounts,
          totalVotes: totalQualityVotes,
          isHighQuality: totalQualityVotes >= 2,
          userVotedTags: userQualityVotes
        },
        mindChangeStats: mindStats,

        poll: post.poll ? {
          id: post.poll.id,
          question: post.poll.question,
          totalVotes: post.poll.totalVotes,
          expiresAt: post.poll.expiresAt,
          userVotedOptionId,
          options: post.poll.options.map(opt => ({
            id: opt.id,
            text: opt.text,
            voteCount: opt.voteCount
          }))
        } : null
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createPost(req, res, next) {
  try {
    const validated = postSchema.parse(req.body);
    const userId = req.user.id;

    // Check in-built AI content moderation
    const moderation = await analyzeContentWithAI(validated.content, validated.title, 'post');

    // Instant AI Badwords & Negativity Blocker:
    if (moderation.instantAction === 'BLOCKED' || (moderation.detectedBadwords && moderation.detectedBadwords.length > 0)) {
      return res.status(400).json({
        success: false,
        message: `Prohibited content detected. In-built AI filter blocked this discussion due to: ${moderation.blockReason || moderation.detectedBadwords.join(', ')}. Please keep discussions constructive.`,
        code: "PROHIBITED_CONTENT",
        detectedBadwords: moderation.detectedBadwords,
        negativityScore: moderation.negativityScore,
        cleanedContent: moderation.cleanedContent
      });
    }

    // Choose Identity: persistent or disappearing temporary
    let identityId;
    if (validated.useTemporaryIdentity) {
      const tempIdData = generateAnonymousIdentity();
      const tempIdentity = await prisma.anonymousIdentity.create({
        data: {
          ...tempIdData,
          identityType: 'TEMPORARY',
          userId
        }
      });
      identityId = tempIdentity.id;
    } else {
      let identity = req.activeIdentity;
      if (!identity) {
        const idData = generateAnonymousIdentity();
        identity = await prisma.anonymousIdentity.create({
          data: { ...idData, identityType: 'PERSISTENT', userId }
        });
      }
      identityId = identity.id;
    }

    const postStatus = moderation.riskLevel === 'HIGH' ? 'PENDING_REVIEW' : 'PUBLISHED';

    const post = await prisma.$transaction(async (tx) => {
      const newPost = await tx.post.create({
        data: {
          title: validated.title,
          content: validated.content,
          postType: validated.postType,
          hashtags: validated.hashtags || [],
          allowComments: validated.allowComments,
          status: postStatus,
          mediaUrl: req.file ? `/uploads/posts/${req.file.filename}` : req.body.mediaUrl || null,
          topicId: validated.topicId,
          userId,
          identityId,

          // 15 Feature Enhancements
          statementType: validated.statementType || 'OPINION',
          isChallengeOpinion: Boolean(validated.isChallengeOpinion),
          sourceUrl: validated.sourceUrl || null,
          sourceTitle: validated.sourceTitle || null,
          sourceType: validated.sourceType || null,
          slowMode: Boolean(validated.slowMode),
          slowModeSeconds: validated.slowModeSeconds || 30,
          language: validated.language || 'en',
          isPotentialScam: Boolean(moderation.isPotentialScam),
          scamReason: moderation.scamReason || null
        },
        include: {
          identity: true,
          topic: true
        }
      });

      // Store moderation result
      await tx.moderationResult.create({
        data: {
          postId: newPost.id,
          targetType: 'POST',
          toxicityScore: moderation.toxicityScore,
          harassmentScore: moderation.harassmentScore,
          spamScore: moderation.spamScore,
          threatScore: moderation.threatScore,
          riskLevel: moderation.riskLevel,
          recommendedAction: moderation.recommendedAction,
          flaggedKeywords: moderation.flaggedKeywords
        }
      });

      // If HIGH risk, create an automatic report for moderators to inspect
      if (moderation.riskLevel === 'HIGH') {
        const report = await tx.report.create({
          data: {
            reporterUserId: userId,
            targetType: 'POST',
            postId: newPost.id,
            reason: moderation.threatScore > 0.5 ? 'THREAT' : 'HARASSMENT',
            explanation: `Automated AI safety trigger: ${moderation.summary}`,
            status: 'PENDING'
          }
        });

        emitToModerators('moderation:new_report', {
          reportId: report.id,
          targetType: 'POST',
          title: newPost.title,
          riskLevel: moderation.riskLevel,
          toxicityScore: moderation.toxicityScore
        });
      }

      // Update topic post count if published
      if (postStatus === 'PUBLISHED') {
        await tx.topic.update({
          where: { id: validated.topicId },
          data: { postCount: { increment: 1 } }
        });
      }

      return newPost;
    });

    if (postStatus === 'PENDING_REVIEW') {
      return res.status(202).json({
        success: true,
        message: "Your post has been flagged by AI safety filters and is pending moderator review.",
        status: "PENDING_REVIEW",
        postId: post.id
      });
    }

    return res.status(201).json({
      success: true,
      message: "Discussion published anonymously.",
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        postType: post.postType,
        hashtags: post.hashtags,
        createdAt: post.createdAt,
        identity: serializePublicIdentity(post.identity),
        topic: post.topic
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req, res, next) {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const isAuthor = post.userId === req.user.id;
    const isStaff = ['ADMIN', 'MODERATOR'].includes(req.user.role);

    if (!isAuthor && !isStaff) {
      return res.status(403).json({ success: false, message: "Permission denied." });
    }

    await prisma.post.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Discussion removed successfully."
    });
  } catch (err) {
    next(err);
  }
}

export async function getPostPerspectives(req, res, next) {
  try {
    const { id } = req.params;
    const perspectives = await generatePerspectivesForPost(id);
    return res.status(200).json({
      success: true,
      perspectives
    });
  } catch (err) {
    next(err);
  }
}

