import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../models/typing.types';
import { CreateRoomSchema, JoinRoomSchema, RaceProgressSchema } from '../models/typing.schema';
import { roomService } from './room.service';
import { applySocketRateLimit } from '../middlewares/rateLimiter';
import { RoomError, ValidationError, AntiCheatError, SessionNotFoundError } from '../utils/errorResponse';
import { logger } from '../utils/logger';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const RACE_FINALIZE_GRACE_MS = 15000; // wait for stragglers before persisting + closing out the race

const broadcastRoomState = (io: TypedServer, roomId: string): void => {
  const room = roomService.getRoom(roomId);
  if (!room) return;
  io.to(roomId).emit('room_state', roomService.toStatePayload(room));
};

const maybeStartCountdown = (io: TypedServer, roomId: string): void => {
  const room = roomService.getRoom(roomId);
  if (!room || !roomService.canStart(room)) return;

  roomService.beginCountdown(
    roomId,
    (secondsRemaining) => io.to(roomId).emit('room_countdown', { roomId, secondsRemaining }),
    () => {
      const started = roomService.startRace(roomId);
      io.to(roomId).emit('race_started', {
        roomId,
        promptId: started.prompt!.id,
        textPrompt: started.prompt!.content,
        characterCount: started.prompt!.characterCount,
        startTime: started.startTime!,
      });
      broadcastRoomState(io, roomId);
    }
  );
};

export function registerRoomSocketHandlers(io: TypedServer, socket: TypedSocket): void {
  const userId = socket.data.user!.id;
  const username = socket.data.user!.username;

  socket.on('create_room', (payload) => {
    try {
      if (!applySocketRateLimit(socket, 'create_room')) return;

      const parseResult = CreateRoomSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.issues[0]?.message || 'Invalid create_room payload');
      }

      const room = roomService.createRoom(userId, username, parseResult.data?.maxPlayers);
      socket.data.roomId = room.roomId;
      socket.join(room.roomId);

      broadcastRoomState(io, room.roomId);
      logger.info('Room created via socket', { roomId: room.roomId, code: room.code, userId });
    } catch (error) {
      handleSocketError(socket, 'create_room', error);
    }
  });

  socket.on('join_room', (payload) => {
    try {
      if (!applySocketRateLimit(socket, 'join_room')) return;

      const parseResult = JoinRoomSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.issues[0]?.message || 'Invalid join_room payload');
      }

      const room = roomService.joinRoom(parseResult.data.code, userId, username);
      socket.data.roomId = room.roomId;
      socket.join(room.roomId);

      broadcastRoomState(io, room.roomId);
    } catch (error) {
      handleSocketError(socket, 'join_room', error);
    }
  });

  socket.on('leave_room', () => {
    try {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const room = roomService.leaveRoom(roomId, userId);
      socket.leave(roomId);
      delete socket.data.roomId;

      if (room) broadcastRoomState(io, roomId);
    } catch (error) {
      handleSocketError(socket, 'leave_room', error);
    }
  });

  socket.on('toggle_ready', () => {
    try {
      const roomId = socket.data.roomId;
      if (!roomId) throw new RoomError('You are not in a room.', 'NOT_IN_ROOM');

      roomService.toggleReady(roomId, userId);
      broadcastRoomState(io, roomId);
      maybeStartCountdown(io, roomId);
    } catch (error) {
      handleSocketError(socket, 'toggle_ready', error);
    }
  });

  socket.on('race_progress', (payload) => {
    try {
      if (!applySocketRateLimit(socket, 'race_progress')) return;

      const roomId = socket.data.roomId;
      if (!roomId) throw new RoomError('You are not in a room.', 'NOT_IN_ROOM');

      const parseResult = RaceProgressSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new ValidationError(
          `Payload validation error: ${parseResult.error.issues.map((e) => e.message).join(', ')}`
        );
      }

      const { typedIndex, correctCharacters } = parseResult.data;
      const { room, player, justFinished } = roomService.processRaceProgress(
        roomId,
        userId,
        typedIndex,
        correctCharacters
      );

      io.to(roomId).emit('race_progress_update', {
        userId: player.userId,
        username: player.username,
        wpm: player.wpm,
        accuracy: player.accuracy,
        progressPercent: player.progressPercent,
      });

      if (justFinished) {
        io.to(roomId).emit('player_finished', {
          roomId,
          userId: player.userId,
          username: player.username,
          placement: player.placement!,
          wpm: player.wpm,
          accuracy: player.accuracy,
        });

        if (roomService.allFinished(room)) {
          settleRace(io, roomId, 0);
        } else {
          settleRace(io, roomId, RACE_FINALIZE_GRACE_MS);
        }
      }
    } catch (error) {
      handleSocketError(socket, 'race_progress', error);
    }
  });

  socket.on('disconnect', (reason) => {
    const roomId = socket.data.roomId;
    if (roomId) {
      const room = roomService.markDisconnected(userId);
      if (room) {
        broadcastRoomState(io, roomId);
        if (room.status === 'racing' && roomService.allFinished(room)) {
          settleRace(io, roomId, 0);
        }
      }
    }
    logger.info('Room socket disconnected', { socketId: socket.id, userId, reason });
  });
}

function settleRace(io: TypedServer, roomId: string, delayMs: number): void {
  roomService.scheduleFinalize(roomId, delayMs, (matchId) => {
    const room = roomService.getRoom(roomId);
    if (!room) return;

    const state = roomService.toStatePayload(room);
    io.to(roomId).emit('race_summary', {
      roomId,
      matchId,
      results: state.players
        .map((p) => ({
          userId: p.userId,
          username: p.username,
          placement: p.placement,
          wpm: p.wpm,
          accuracy: p.accuracy,
          finished: p.finished,
        }))
        .sort((a, b) => (a.placement ?? 999) - (b.placement ?? 999)),
    });
    broadcastRoomState(io, roomId);
  });
}

function handleSocketError(socket: TypedSocket, eventName: string, error: unknown): void {
  const timestamp = Date.now();

  if (error instanceof AntiCheatError) {
    logger.warn(`Anti-cheat violation in room event '${eventName}'`, {
      socketId: socket.id,
      userId: socket.data.user?.id,
      error: error.message,
    });
    socket.emit('error_event', { code: error.code, message: error.message, timestamp });
  } else if (error instanceof RoomError || error instanceof ValidationError || error instanceof SessionNotFoundError) {
    logger.warn(`Room operational error in event '${eventName}'`, {
      socketId: socket.id,
      code: error.code,
      message: error.message,
    });
    socket.emit('error_event', { code: error.code, message: error.message, timestamp });
  } else {
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error(`Unhandled room socket error in event '${eventName}'`, {
      socketId: socket.id,
      error: errMessage,
    });
    socket.emit('error_event', {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred while processing your room action.',
      timestamp,
    });
  }
}
