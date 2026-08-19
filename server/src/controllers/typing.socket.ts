import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../models/typing.types';
import { StartSoloSessionSchema, TypingProgressSchema } from '../models/typing.schema';
import { typingService } from './typing.service';
import { applySocketRateLimit, defaultSocketRateLimiter } from '../middlewares/rateLimiter';
import { SocketError, ValidationError, AntiCheatError } from '../utils/errorResponse';
import { logger } from '../utils/logger';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerTypingSocketHandlers(io: TypedServer, socket: TypedSocket): void {
  const userId = socket.data.user?.id || 'mock_user_101';

  logger.info('WebSocket client connected', {
    socketId: socket.id,
    userId,
    ip: socket.handshake.address,
  });

  socket.on('start_solo_session', (payload) => {
    try {
      if (!applySocketRateLimit(socket, 'start_solo_session')) return;

      const parseResult = StartSoloSessionSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.issues[0]?.message || 'Invalid start_solo_session payload');
      }

      const session = typingService.startSession(userId, parseResult.data?.promptId);

      socket.emit('session_started', {
        sessionId: session.sessionId,
        textPrompt: session.textPrompt,
        characterCount: session.characterCount,
        startTime: session.startTime,
      });
    } catch (error) {
      handleSocketError(socket, 'start_solo_session', error);
    }
  });

  socket.on('typing_progress', (payload) => {
    try {
      if (!applySocketRateLimit(socket, 'typing_progress')) return;

      const parseResult = TypingProgressSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new ValidationError(
          `Payload validation error: ${parseResult.error.issues.map((e: { message: string }) => e.message).join(', ')}`
        );
      }

      const { sessionId, typedIndex, correctCharacters } = parseResult.data;
      const session = typingService.processProgress(sessionId, typedIndex, correctCharacters);

      socket.emit('stats_update', {
        sessionId: session.sessionId,
        typedIndex: session.typedIndex,
        correctCharacters: session.correctCharacters,
        wpm: session.stats.wpm,
        wps: session.stats.wps,
        accuracy: session.stats.accuracy,
        progressPercent: session.stats.progressPercent,
        elapsedTimeMs: session.stats.elapsedTimeMs,
        isCompleted: session.isCompleted,
      });

      if (session.isCompleted) {
        socket.emit('session_summary', {
          sessionId: session.sessionId,
          finalWpm: session.stats.wpm,
          finalWps: session.stats.wps,
          finalAccuracy: session.stats.accuracy,
          totalTimeMs: session.stats.elapsedTimeMs,
          completedAt: session.endTime || Date.now(),
        });
      }
    } catch (error) {
      handleSocketError(socket, 'typing_progress', error);
    }
  });

  socket.on('disconnect', (reason) => {
    defaultSocketRateLimiter.removeSocket(socket.id);
    logger.info('WebSocket client disconnected', {
      socketId: socket.id,
      userId,
      reason,
    });
  });
}

function handleSocketError(socket: TypedSocket, eventName: string, error: any): void {
  const timestamp = Date.now();

  if (error instanceof AntiCheatError) {
    logger.warn(`Anti-cheat violation detected in event '${eventName}'`, {
      socketId: socket.id,
      userId: socket.data.user?.id,
      error: error.message,
    });

    socket.emit('error_event', {
      code: 'ANTI_CHEAT_VIOLATION',
      message: 'Unnatural typing velocity detected. Session progress rejected.',
      timestamp,
    });
  } else if (error instanceof SocketError) {
    logger.warn(`Socket operational error in event '${eventName}'`, {
      socketId: socket.id,
      code: error.code,
      message: error.message,
    });

    socket.emit('error_event', {
      code: error.code,
      message: error.message,
      timestamp,
    });
  } else {
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error(`Unhandled socket error in event '${eventName}'`, {
      socketId: socket.id,
      error: errMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    socket.emit('error_event', {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred while processing keystroke progress.',
      timestamp,
    });
  }
}

