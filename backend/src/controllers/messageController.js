import { prisma } from '../config/db.js';
import { messageSchema } from '../validators/index.js';
import { analyzeContent } from '../services/moderationService.js';
import { serializePublicIdentity } from '../utils/safeUserSerializer.js';
import { emitToConversation, emitToUser } from '../services/socketService.js';

export async function getConversations(req, res, next) {
  try {
    const userId = req.user.id;

    // Fetch messages where user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderUserId: userId }, { receiverUserId: userId }]
      },
      include: {
        senderIdentity: true,
        receiverIdentity: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by conversationId
    const conversationsMap = {};
    messages.forEach(msg => {
      if (!conversationsMap[msg.conversationId]) {
        const isSender = msg.senderUserId === userId;
        const otherIdentity = isSender ? msg.receiverIdentity : msg.senderIdentity;
        conversationsMap[msg.conversationId] = {
          conversationId: msg.conversationId,
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
            isSelf: isSender
          },
          otherIdentity: serializePublicIdentity(otherIdentity)
        };
      }
    });

    return res.status(200).json({
      success: true,
      conversations: Object.values(conversationsMap)
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecipients(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const { search } = req.query;

    const where = {
      userId: { not: currentUserId },
      identityType: 'PERSISTENT',
      user: {
        status: 'ACTIVE'
      }
    };

    if (search && typeof search === 'string' && search.trim()) {
      where.displayName = {
        contains: search.trim(),
        mode: 'insensitive'
      };
    }

    const identities = await prisma.anonymousIdentity.findMany({
      where,
      take: 25,
      include: {
        user: {
          select: {
            reputationScore: true,
            contributionBadge: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const recipients = identities.map(ident => ({
      id: ident.id,
      displayName: ident.displayName,
      avatarSeed: ident.avatarSeed,
      avatarShape: ident.avatarShape,
      avatarColor: ident.avatarColor,
      identityType: ident.identityType,
      reputationScore: ident.user?.reputationScore || 100,
      contributionBadge: ident.user?.contributionBadge || '🌱 Curious Mind'
    }));

    return res.status(200).json({
      success: true,
      recipients
    });
  } catch (err) {
    next(err);
  }
}


export async function getMessagesByConversation(req, res, next) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        OR: [{ senderUserId: userId }, { receiverUserId: userId }]
      },
      include: {
        senderIdentity: true,
        receiverIdentity: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverUserId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    const formatted = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      isSelf: msg.senderUserId === userId,
      createdAt: msg.createdAt,
      senderIdentity: serializePublicIdentity(msg.senderIdentity)
    }));

    return res.status(200).json({
      success: true,
      messages: formatted
    });
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const validated = messageSchema.parse(req.body);
    const senderUserId = req.user.id;
    const senderIdentity = req.activeIdentity;

    // Find receiver identity and user
    const receiverIdentity = await prisma.anonymousIdentity.findUnique({
      where: { id: validated.receiverIdentityId },
      include: { user: true }
    });

    if (!receiverIdentity) {
      return res.status(404).json({ success: false, message: "Recipient identity not found." });
    }

    const receiverUserId = receiverIdentity.userId;

    if (senderUserId === receiverUserId) {
      return res.status(400).json({ success: false, message: "You cannot message yourself." });
    }

    // Check blocking
    const isBlocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: receiverUserId, blockedId: senderUserId },
          { blockerId: senderUserId, blockedId: receiverUserId }
        ]
      }
    });

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: "You cannot send a message to this recipient."
      });
    }

    // Moderation check
    const moderation = await analyzeContent(validated.content, null, 'message');
    if (moderation.riskLevel === 'HIGH') {
      return res.status(400).json({
        success: false,
        message: "Your message contains flagged or harmful content and cannot be delivered.",
        code: "MESSAGE_FLAGGED"
      });
    }

    // Determine deterministic conversationId between two users
    const conversationId = [senderUserId, receiverUserId].sort().join(':');

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderUserId,
        senderIdentityId: senderIdentity.id,
        receiverUserId,
        receiverIdentityId: receiverIdentity.id,
        content: validated.content
      },
      include: {
        senderIdentity: true,
        receiverIdentity: true
      }
    });

    const safeMessage = {
      id: message.id,
      conversationId,
      content: message.content,
      createdAt: message.createdAt,
      senderIdentity: serializePublicIdentity(message.senderIdentity),
      isSelf: true
    };

    // Emit live to conversation room
    emitToConversation(conversationId, 'message:received', safeMessage);

    // Emit live to receiver user
    emitToUser(receiverUserId, 'message:new', {
      ...safeMessage,
      isSelf: false
    });

    // Create persistent notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverUserId,
        type: 'MESSAGE',
        title: 'New private message',
        content: `${senderIdentity.displayName} sent you an anonymous message.`,
        link: `/messages`
      }
    });

    return res.status(201).json({
      success: true,
      message: safeMessage
    });
  } catch (err) {
    next(err);
  }
}
