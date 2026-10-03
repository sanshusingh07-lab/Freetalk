import { prisma } from '../config/db.js';

export async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 40
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (id === 'all') {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
    } else {
      await prisma.notification.update({
        where: { id, userId },
        data: { isRead: true }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notifications updated."
    });
  } catch (err) {
    next(err);
  }
}
