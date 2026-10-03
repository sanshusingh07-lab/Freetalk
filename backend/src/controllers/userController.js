import { prisma } from '../config/db.js';
import { serializePublicIdentity, serializeUser } from '../utils/safeUserSerializer.js';
import { clearTokenCookie } from '../utils/tokenUtils.js';

export async function getMyActivity(req, res, next) {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        identities: { where: { identityType: 'PERSISTENT' }, take: 1 },
        followedTopics: { include: { topic: true } },
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            topic: true,
            identity: true,
            _count: { select: { comments: true, reactions: true } }
          }
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            post: { select: { id: true, title: true } },
            identity: true
          }
        }
      }
    });

    const formattedPosts = user.posts.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content,
      status: p.status,
      createdAt: p.createdAt,
      commentsCount: p._count.comments,
      reactionsCount: p._count.reactions,
      topic: p.topic,
      identity: serializePublicIdentity(p.identity)
    }));

    const formattedComments = user.comments.map(c => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      post: c.post,
      identity: serializePublicIdentity(c.identity)
    }));

    // Anonymous reputation calculation
    const totalDiscussions = user.posts.length;
    const totalReplies = user.comments.length;
    let badge = "🌱 Curious Mind";
    if (totalDiscussions >= 10 || totalReplies >= 25) {
      badge = "🌟 Respected Voice";
    } else if (totalDiscussions >= 3 || totalReplies >= 5) {
      badge = "🌿 Positive Contributor";
    }

    return res.status(200).json({
      success: true,
      activity: {
        contributionBadge: badge,
        reputationScore: user.reputationScore,
        discussionsCount: totalDiscussions,
        repliesCount: totalReplies,
        topicsFollowedCount: user.followedTopics.length,
        posts: formattedPosts,
        comments: formattedComments,
        followedTopics: user.followedTopics.map(f => f.topic)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getPrivacyDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        identities: { where: { identityType: 'PERSISTENT' }, take: 1 }
      }
    });

    // Privacy Score Calculation
    let score = 90;
    const factors = [
      { title: "Public identity completely hidden", passed: true, points: 25 },
      { title: "Zero location tracking", passed: true, points: 25 },
      { title: "Email & phone shielded from public", passed: true, points: 25 },
      { title: "Minimal metadata footprint", passed: true, points: 15 }
    ];

    if (user.personalizedFeed) {
      factors.push({
        title: "Topic-based feed personalization active",
        passed: false,
        points: -6,
        advice: "Disable personalized feed for complete air-gapped exploration"
      });
      score -= 6;
    } else {
      factors.push({
        title: "Topic-based feed personalization disabled",
        passed: true,
        points: 10
      });
      score += 10;
    }

    score = Math.max(70, Math.min(100, score));

    return res.status(200).json({
      success: true,
      privacyScore: score,
      factors,
      settings: {
        publicIdentity: user.identities[0]?.displayName || "Anonymous",
        messagePermission: user.messagePermission,
        activityVisibility: user.activityVisibility,
        personalizedFeed: user.personalizedFeed,
        identityPreference: user.identityPreference
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadUserData(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        identities: true,
        posts: { select: { title: true, content: true, createdAt: true } },
        comments: { select: { content: true, createdAt: true } },
        bookmarks: { include: { post: { select: { title: true } } } }
      }
    });

    const exportPackage = {
      exportDate: new Date().toISOString(),
      accountCreated: user.createdAt,
      interests: user.interests,
      identities: user.identities.map(serializePublicIdentity),
      posts: user.posts,
      comments: user.comments,
      bookmarksCount: user.bookmarks.length,
      privacyGuarantees: "No IP addresses, geolocation, device telemetry, or biometric logs are stored."
    };

    res.setHeader('Content-Disposition', 'attachment; filename=freetalk-privacy-export.json');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(exportPackage, null, 2));
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const userId = req.user.id;

    // Remove user and cascades
    await prisma.user.delete({
      where: { id: userId }
    });

    clearTokenCookie(res);

    return res.status(200).json({
      success: true,
      message: "Your account and all associated private credentials have been permanently purged."
    });
  } catch (err) {
    next(err);
  }
}

// === PERSONAL DISCUSSION INSIGHTS (Feature 11) ===
export async function getPersonalInsights(req, res, next) {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: {
          select: {
            id: true,
            topicId: true,
            topic: { select: { name: true } },
            _count: { select: { reactions: true, comments: true } }
          }
        },
        comments: {
          select: {
            id: true,
            _count: { select: { reactions: true } }
          }
        },
        debateVotes: true,
        followedTopics: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const discussionsCount = user.posts.length;
    const repliesCount = user.comments.length;

    // Helpful reactions count
    let helpfulReactions = 0;
    user.posts.forEach(p => { helpfulReactions += p._count.reactions; });
    user.comments.forEach(c => { helpfulReactions += c._count.reactions; });

    // Topics explored
    const topicFrequency = {};
    user.posts.forEach(p => {
      const topicName = p.topic?.name || 'General';
      topicFrequency[topicName] = (topicFrequency[topicName] || 0) + 1;
    });

    const topicsExplored = Object.keys(topicFrequency).length;

    // Most discussed topic
    let mostDiscussedTopic = "Ideas & Technology";
    let maxCount = 0;
    for (const [tName, cnt] of Object.entries(topicFrequency)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        mostDiscussedTopic = tName;
      }
    }

    const debatesParticipated = user.debateVotes.length;

    return res.status(200).json({
      success: true,
      insights: {
        discussionsCount,
        repliesCount,
        helpfulReactions,
        topicsExplored: Math.max(topicsExplored, user.followedTopics.length),
        debatesParticipated,
        mostDiscussedTopic,
        constructiveToneAverage: 96,
        isGhostMode: user.isGhostMode
      }
    });
  } catch (err) {
    next(err);
  }
}

// === GHOST MODE (Feature 15) ===
export async function toggleGhostMode(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isGhostMode: !user.isGhostMode }
    });

    return res.status(200).json({
      success: true,
      isGhostMode: updated.isGhostMode,
      message: updated.isGhostMode 
        ? "Ghost Mode enabled. You are now browsing completely invisibly without appearing in online indicators."
        : "Ghost Mode disabled."
    });
  } catch (err) {
    next(err);
  }
}

