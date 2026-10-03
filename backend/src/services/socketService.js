import { Server } from 'socket.io';
import { verifyToken } from '../utils/tokenUtils.js';

let io = null;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      let token = null;

      if (cookieHeader) {
        const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
        token = cookies['access_token'];
      }

      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }

      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          socket.userId = decoded.userId;
        }
      }
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on('join:identity', (identityId) => {
      if (identityId) socket.join(`identity:${identityId}`);
    });

    socket.on('join:post', (postId) => {
      if (postId) socket.join(`post:${postId}`);
    });

    socket.on('leave:post', (postId) => {
      if (postId) socket.leave(`post:${postId}`);
    });

    socket.on('join:conversation', (conversationId) => {
      if (conversationId) socket.join(`convo:${conversationId}`);
    });

    socket.on('join:admin', () => {
      socket.join('admin:moderation');
    });

    socket.on('disconnect', () => {
      // socket disconnected cleanly
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export function emitToUser(userId, event, data) {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToConversation(conversationId, event, data) {
  if (io && conversationId) {
    io.to(`convo:${conversationId}`).emit(event, data);
  }
}

export function emitToPost(postId, event, data) {
  if (io && postId) {
    io.to(`post:${postId}`).emit(event, data);
  }
}

export function emitToModerators(event, data) {
  if (io) {
    io.to('admin:moderation').emit(event, data);
  }
}
