import { Socket } from 'socket.io';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../models/typing.types';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const getHandshakeValue = (
  socket: TypedSocket,
  keys: string[]
): string | undefined => {
  const { auth, headers, query } = socket.handshake;

  for (const key of keys) {
    const lowerKey = key.toLowerCase();

    // Check auth object
    if (auth && typeof auth === 'object') {
      const val = (auth as Record<string, unknown>)[key] ?? (auth as Record<string, unknown>)[lowerKey];
      if (typeof val === 'string' && val.trim().length > 0) {
        return val.trim();
      }
    }

    // Check headers object
    if (headers && typeof headers === 'object') {
      const val = headers[key] ?? headers[lowerKey];
      if (typeof val === 'string' && val.trim().length > 0) {
        return val.trim();
      }
    }

    // Check query object
    if (query && typeof query === 'object') {
      const val = query[key] ?? query[lowerKey];
      if (typeof val === 'string' && val.trim().length > 0) {
        return val.trim();
      }
    }
  }

  return undefined;
};

const extractToken = (socket: TypedSocket): string | undefined => {
  const rawToken = getHandshakeValue(socket, ['token', 'authorization']);
  if (!rawToken) return undefined;

  if (rawToken.startsWith('Bearer ')) {
    return rawToken.slice(7).trim();
  }
  return rawToken.trim();
};

export const socketAuthMiddleware = (
  socket: TypedSocket,
  next: (err?: Error) => void
): void => {
  try {
    const token = extractToken(socket);
    const isDev = env.NODE_ENV !== 'production';
    const isExactMockToken = Boolean(token && token === env.MOCK_AUTH_TOKEN);
    const isMockTokenPrefix = Boolean(token && token.startsWith('mock_token_'));
    const isDevNoToken = Boolean(isDev && !token);

    const isAuthorized = isExactMockToken || isMockTokenPrefix || isDevNoToken;

    if (!isAuthorized) {
      logger.warn('Socket authentication failed: Invalid or missing token', {
        socketId: socket.id,
        tokenProvided: Boolean(token),
        ip: socket.handshake.address,
      });

      const authError = new Error('Authentication error: Invalid or missing handshake auth token');
      return next(authError);
    }

    const explicitUserId = getHandshakeValue(socket, ['x-user-id', 'userId', 'id']);
    const explicitUsername = getHandshakeValue(socket, ['x-username', 'username']);

    let userId: string;
    let username: string;

    const shortSocketId = socket.id ? socket.id.substring(0, 6) : Math.random().toString(36).substring(2, 8);

    if (explicitUserId) {
      userId = explicitUserId;
    } else if (token && token.startsWith('mock_token_')) {
      const suffix = token.substring('mock_token_'.length).trim();
      if (suffix && suffix.toLowerCase() !== 'xyz') {
        userId = `user_${suffix}`;
      } else {
        userId = `user_${shortSocketId}`;
      }
    } else {
      userId = `user_${shortSocketId}`;
    }

    if (explicitUsername) {
      username = explicitUsername;
    } else if (explicitUserId) {
      username = `User_${explicitUserId.replace(/^user_/i, '')}`;
    } else if (token && token.startsWith('mock_token_')) {
      const suffix = token.substring('mock_token_'.length).trim();
      if (suffix && suffix.toLowerCase() !== 'xyz') {
        username = `User_${suffix}`;
      } else {
        username = `User_${shortSocketId.substring(0, 4)}`;
      }
    } else {
      username = `User_${shortSocketId.substring(0, 4)}`;
    }

    socket.data.user = {
      id: userId,
      username,
    };
    socket.data.userId = userId;
    socket.data.username = username;

    logger.debug('Socket authenticated successfully', {
      socketId: socket.id,
      userId: socket.data.userId,
      username: socket.data.username,
      tokenProvided: Boolean(token),
    });

    return next();
  } catch (error) {
    logger.error('Unexpected error during socket authentication middleware execution', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return next(new Error('Authentication error: Internal middleware exception'));
  }
};


