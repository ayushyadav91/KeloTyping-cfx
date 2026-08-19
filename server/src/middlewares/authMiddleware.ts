import { Socket } from 'socket.io';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../models/typing.types';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const socketAuthMiddleware = (
  socket: TypedSocket,
  next: (err?: Error) => void
): void => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.['authorization'];
  const isDev = env.NODE_ENV !== 'production';

  if (token === env.MOCK_AUTH_TOKEN || (isDev && !token)) {
    socket.data.user = {
      id: 'mock_user_101',
      username: 'User',
    };

    logger.debug('Socket authenticated successfully', {
      socketId: socket.id,
      userId: socket.data.user.id,
      tokenProvided: Boolean(token),
    });

    return next();
  }

  logger.warn('Socket authentication failed: Invalid token', {
    socketId: socket.id,
    ip: socket.handshake.address,
  });

  const authError = new Error('Authentication error: Invalid or missing handshake auth token');
  return next(authError);
};

