import { prisma } from '../config/db.js';

export async function getTopics(req, res, next) {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { postCount: 'desc' },
      include: {
        _count: { select: { posts: true, followers: true } }
      }
    });

    let followedTopicIds = [];
    if (req.user) {
      const follows = await prisma.topicFollow.findMany({
        where: { userId: req.user.id }
      });
      followedTopicIds = follows.map(f => f.topicId);
    }

    const formatted = topics.map(t => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: t.description,
      icon: t.icon,
      color: t.color,
      postCount: t._count.posts,
      followerCount: t._count.followers,
      isFollowing: followedTopicIds.includes(t.id)
    }));

    return res.status(200).json({
      success: true,
      topics: formatted
    });
  } catch (err) {
    next(err);
  }
}

export async function getTopicBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const topic = await prisma.topic.findUnique({
      where: { slug },
      include: {
        _count: { select: { posts: true, followers: true } }
      }
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found."
      });
    }

    let isFollowing = false;
    if (req.user) {
      const follow = await prisma.topicFollow.findUnique({
        where: {
          userId_topicId: { userId: req.user.id, topicId: topic.id }
        }
      });
      isFollowing = Boolean(follow);
    }

    return res.status(200).json({
      success: true,
      topic: {
        id: topic.id,
        slug: topic.slug,
        name: topic.name,
        description: topic.description,
        icon: topic.icon,
        color: topic.color,
        postCount: topic._count.posts,
        followerCount: topic._count.followers,
        isFollowing
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleFollowTopic(req, res, next) {
  try {
    const { id: topicId } = req.params;
    const userId = req.user.id;

    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) {
      return res.status(404).json({ success: false, message: "Topic not found." });
    }

    const existing = await prisma.topicFollow.findUnique({
      where: {
        userId_topicId: { userId, topicId }
      }
    });

    let isFollowing;
    if (existing) {
      await prisma.topicFollow.delete({ where: { id: existing.id } });
      await prisma.topic.update({
        where: { id: topicId },
        data: { followerCount: { decrement: 1 } }
      });
      isFollowing = false;
    } else {
      await prisma.topicFollow.create({
        data: { userId, topicId }
      });
      await prisma.topic.update({
        where: { id: topicId },
        data: { followerCount: { increment: 1 } }
      });
      isFollowing = true;
    }

    return res.status(200).json({
      success: true,
      isFollowing,
      message: isFollowing ? `Now following #${topic.name}` : `Unfollowed #${topic.name}`
    });
  } catch (err) {
    next(err);
  }
}
