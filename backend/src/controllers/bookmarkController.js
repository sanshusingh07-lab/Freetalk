import { prisma } from '../config/db.js';
import { serializePublicIdentity } from '../utils/safeUserSerializer.js';

export async function toggleBookmark(req, res, next) {
  try {
    const { id: postId } = req.params;
    const { collectionName = 'Default' } = req.body;
    const userId = req.user.id;

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_postId: { userId, postId }
      }
    });

    let isBookmarked;
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      isBookmarked = false;
    } else {
      await prisma.bookmark.create({
        data: { userId, postId, collectionName }
      });
      isBookmarked = true;
    }

    return res.status(200).json({
      success: true,
      isBookmarked,
      message: isBookmarked ? "Discussion saved to bookmarks." : "Removed from bookmarks."
    });
  } catch (err) {
    next(err);
  }
}

export async function getBookmarks(req, res, next) {
  try {
    const userId = req.user.id;
    const { collection } = req.query;

    const whereClause = { userId };
    if (collection) {
      whereClause.collectionName = collection;
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: whereClause,
      include: {
        post: {
          include: {
            identity: true,
            topic: true,
            _count: { select: { comments: true, reactions: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = bookmarks
      .filter(b => b.post && b.post.status === 'PUBLISHED')
      .map(b => ({
        id: b.id,
        collectionName: b.collectionName,
        savedAt: b.createdAt,
        post: {
          id: b.post.id,
          title: b.post.title,
          content: b.post.content,
          createdAt: b.post.createdAt,
          commentsCount: b.post._count.comments,
          reactionsCount: b.post._count.reactions,
          isBookmarked: true,
          identity: serializePublicIdentity(b.post.identity),
          topic: b.post.topic
        }
      }));

    return res.status(200).json({
      success: true,
      bookmarks: formatted
    });
  } catch (err) {
    next(err);
  }
}
