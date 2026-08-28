import { Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../models/typing.types';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

interface RateLimitConfig {
  windowMs: number;
  maxEvents: number;
}

export class SocketRateLimiter {
  private eventTimestamps: Map<string, number[]> = new Map();

  constructor(private config: RateLimitConfig = { windowMs: 1000, maxEvents: 30 }) {}

  public isAllowed(socketId: string): boolean {
    const now = Date.now();
    const timestamps = this.eventTimestamps.get(socketId) || [];
    const validTimestamps = timestamps.filter((ts) => now - ts < this.config.windowMs);

    if (validTimestamps.length >= this.config.maxEvents) {
      return false;
    }

    validTimestamps.push(now);
    this.eventTimestamps.set(socketId, validTimestamps);
    return true;
  }

  public removeSocket(socketId: string): void {
    this.eventTimestamps.delete(socketId);
  }
}

export const defaultSocketRateLimiter = new SocketRateLimiter({
  windowMs: 1000,
  maxEvents: 25,
});

export const applySocketRateLimit = (
  socket: TypedSocket,
  eventName: string,
  limiter: SocketRateLimiter = defaultSocketRateLimiter
): boolean => {
  if (!limiter.isAllowed(socket.id)) {
    logger.warn('Socket rate limit exceeded', {
      socketId: socket.id,
      userId: socket.data.user?.id,
      eventName,
    });

    socket.emit('error_event', {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Please lower the frequency of event emissions.',
      timestamp: Date.now(),
    });

    return false;
  }

  return true;
};

