import { prisma } from '../config/db.js';

export async function analyzeTopicTrends() {
  const now = new Date();
  const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch all topics with their posts and comments
  const topics = await prisma.topic.findMany({
    include: {
      posts: {
        where: { status: 'PUBLISHED', createdAt: { gte: past7d } },
        include: {
          _count: { select: { comments: true, reactions: true } }
        }
      },
      _count: {
        select: { followers: true }
      }
    }
  });

  const analyzedTopics = topics.map(topic => {
    let recentPostsCount = 0;
    let totalRecentComments = 0;
    let totalRecentReactions = 0;
    let posts24h = 0;

    topic.posts.forEach(post => {
      recentPostsCount++;
      const comments = post._count?.comments || 0;
      const reactions = post._count?.reactions || 0;
      totalRecentComments += comments;
      totalRecentReactions += reactions;

      if (new Date(post.createdAt) >= past24h) {
        posts24h++;
      }
    });

    // AI Discussion Velocity Formula
    // Gives significant weight to discussion depth (comments) and recent 24h burst
    const velocityScore = parseFloat((
      (posts24h * 5.0) +
      (recentPostsCount * 2.0) +
      (totalRecentComments * 3.5) +
      (totalRecentReactions * 1.5) +
      (topic._count.followers * 0.2)
    ).toFixed(2));

    // Dynamic AI Insight generation
    let aiSummary = "Steady discussion across the community.";
    let surgePercentage = Math.min(180, Math.round(velocityScore * 4.5 + 20));

    if (velocityScore > 40) {
      aiSummary = `🔥 High Surge: Over ${totalRecentComments + posts24h * 5} active replies & debates in the last 24 hours.`;
    } else if (velocityScore > 15) {
      aiSummary = `⚡ Fast Rising: Growing discussion volume with ${recentPostsCount} fresh perspectives.`;
    } else if (recentPostsCount > 0) {
      aiSummary = `💬 Thoughtful Discourse: ${recentPostsCount} ongoing discussions.`;
    }

    return {
      id: topic.id,
      slug: topic.slug,
      name: topic.name,
      description: topic.description,
      icon: topic.icon,
      color: topic.color,
      totalPostCount: topic.posts.length,
      followersCount: topic._count.followers,
      velocityScore,
      posts24h,
      totalRecentComments,
      totalRecentReactions,
      surgePercentage,
      aiSummary
    };
  });

  // Sort descending by AI velocity score to make the most discussed topics top-trending
  analyzedTopics.sort((a, b) => b.velocityScore - a.velocityScore);

  // Assign trending ranks (1, 2, 3, etc.)
  const ranked = analyzedTopics.map((item, index) => ({
    ...item,
    trendingRank: index + 1,
    isTopTrending: index < 3
  }));

  return ranked;
}
