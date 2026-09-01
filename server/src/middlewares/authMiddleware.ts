import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import User from '../models/user.model';
import { env } from '../config/env.config';
import { ErrorResponse } from '../utils/errorResponse';
import { logger } from '../utils/logger';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../models/typing.types';

interface JwtPayload {
  id: string;
}

// ---------------------------------------------------------------------------
// REST: verifies the `Authorization: Bearer <token>` header, loads the user,
// and attaches it to req.user for downstream handlers (auth.route, result.route).
// ---------------------------------------------------------------------------
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

    if (!token) throw new ErrorResponse('Not authorized, no token provided', 401);

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.id);
    if (!user) throw new ErrorResponse('Not authorized, user no longer exists', 401);

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ErrorResponse) {
      next(err);
      return;
    }
    next(new ErrorResponse('Not authorized, token failed or expired', 401));
  }
};

// ---------------------------------------------------------------------------
// Socket.IO: verifies the JWT sent as `socket.handshake.auth.token`, loads the
// user from Mongo, and populates socket.data.user for every handler downstream
// (typing.socket, room.socket). Replaces the previous MOCK_AUTH_TOKEN stub —
// dev-mode no-token bypass is gone, every connection needs a real JWT now.
// ---------------------------------------------------------------------------
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const socketAuthMiddleware = async (
  socket: TypedSocket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.headers?.authorization?.toString().replace(/^Bearer\s+/i, ''));

    if (!token) {
      throw new Error('Authentication error: no token provided in handshake');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error('Authentication error: user no longer exists');
    }

    socket.data.user = { id: user._id, username: user.username };

    logger.debug('Socket authenticated successfully', {
      socketId: socket.id,
      userId: user._id,
    });

    next();
  } catch (err) {
    logger.warn('Socket authentication failed', {
      socketId: socket.id,
      ip: socket.handshake.address,
      reason: err instanceof Error ? err.message : 'unknown',
    });
    next(new Error('Authentication error: Invalid or missing/expired token'));
  }
};
