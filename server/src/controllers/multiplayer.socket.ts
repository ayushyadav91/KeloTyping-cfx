import { Server, Socket } from 'socket.io';
import {
  CreateRoomSchema,
  JoinRoomRequestSchema,
  ApproveJoinRequestSchema,
  RejectJoinRequestSchema,
  ToggleReadySchema,
  StartRaceCountdownSchema,
  MultiplayerTypingProgressSchema,
  LeaveRoomSchema,
} from '../models/multiplayer.schema';
import { multiplayerService } from './multiplayer.service';
import { applySocketRateLimit, defaultSocketRateLimiter } from '../middlewares/rateLimiter';
import {
  SocketError,
  ValidationError,
  AntiCheatError,
  InvalidInviteTokenError,
  ExpiredInviteTokenError,
  RoomNotFoundError,
  RoomFullError,
  RoomStateError,
  UnauthorizedRoomActionError,
} from '../utils/errorResponse';
import { logger } from '../utils/logger';

export function registerMultiplayerSocketHandlers(io: Server, socket: Socket): void {
  const user = socket.data.user || {
    id: `mock_user_${socket.id.substring(0, 5)}`,
    username: `User_${socket.id.substring(0, 4)}`,
  };

  
    // Helper to finish a race and broadcast summary to room channel.
   
  const triggerRaceCompletion = (roomCode: string) => {
    try {
      const { leaderboard } = multiplayerService.completeRace(roomCode);
      const room = multiplayerService.getRoom(roomCode);
      const raceDurationMs = room?.raceStartedAt && room?.raceEndedAt
        ? room.raceEndedAt - room.raceStartedAt
        : 0;

      io.to(`race:${roomCode}`).emit('race_summary', {
        roomCode,
        leaderboard,
        raceDurationMs,
      });
    } catch (error) {
      logger.error('Error auto-completing race', { roomCode, error });
    }
  };

  // Create Room
  socket.on('create_room', (payload) => {
    try {
      if (!applySocketRateLimit(socket, 'create_room')) return;

      const parseResult = CreateRoomSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.issues[0]?.message || 'Invalid create_room payload');
      }

      const maxCapacity = parseResult.data?.maxCapacity || 5;
      const promptId = parseResult.data?.promptId;

      const { room, summary } = multiplayerService.createRoom(user, socket.id, maxCapacity, promptId);
      const channelName = `race:${room.roomCode}`;
      socket.join(channelName);

      socket.emit('room_created', {
        roomCode: room.roomCode,
        inviteLink: room.inviteLink,
        inviteToken: room.inviteToken,
        room: summary,
      });

      logger.info('User created and joined multiplayer room channel', {
        socketId: socket.id,
        userId: user.id,
        roomCode: room.roomCode,
      });
    } catch (error) {
      handleMultiplayerSocketError(socket, 'create_room', error);
    }
  });

  //  Join Room Request (Admission Control)
  socket.on('join_room_request', (payload) => {
    try {
      if (!applySocketRateLimit(socket, 'join_room_request')) return;

      const parseResult = JoinRoomRequestSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.issues[0]?.message || 'Invalid join_room_request payload');
      }

      const { roomCode, token } = parseResult.data;
      const { room, hostSocketId, request } = multiplayerService.requestJoinRoom(roomCode, user, socket.id, token);

      if (hostSocketId) {
        io.to(hostSocketId).emit('join_approval_requested', {
          roomCode,
          requester: {
            userId: request.userId,
            username: request.username,
          },
          requestedAt: request.requestedAt,
        });
      }

      logger.info('Join room request forwarded to host', {
        socketId: socket.id,
        userId: user.id,
        roomCode,
      });
    } catch (error) {
      handleMultiplayerSocketError(socket, 'join_room_request', error);
    }
  });

  //  Approve Join Request (Host Only)
  socket.on('approve_join_request', (payload) => {
    try {
      if (!applySocketRateLimit(socket, 'approve_join_request')) return;

      const parseResult = ApproveJoinRequestSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.issues[0]?.message || 'Invalid approve_join_request payload');
      }

      const { roomCode, requesterUserId } = parseResult.data;
      const { room, approvedPlayer, requesterSocketId } = multiplayerService.approveJoinRequest(
        user.id,
        roomCode,
        requesterUserId
      );

      const requesterSocket = io.sockets.sockets.get(requesterSocketId);
      if (requesterSocket) {
        requesterSocket.join(`race:${roomCode}`);
      }

      const summary = multiplayerService.toRoomSummary(room);
      const approvedSummary = multiplayerService.toPlayerSummary(approvedPlayer);

      io.to(`race:${roomCode}`).emit('player_joined', {
        roomCode,
        player: approvedSummary,
        players: summary.players,
      });
    } catch (error) {
      handleMultiplayerSocketError(socket, 'approve_join_request', error);
    }
  });

  //  Reject Join Request (Host Only)
  socket.on('reject_join_request', (payload) => {
    try {
      if (!applySocketRateLimit(socket, 'reject_join_request')) return;

      const parseResult = RejectJoinRequestSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.issues[0]?.message || 'Invalid reject_join_request payload');
      }

      const { roomCode, requesterUserId, reason } = parseResult.data;
      const { requesterSocketId, reason: rejectionReason } = multiplayerService.rejectJoinRequest(
        user.id,
        roomCode,
        requesterUserId,
        reason
      );

      io.to(requesterSocketId).emit('join_request_rejected', {
        roomCode,
        reason: rejectionReason,
      });
    } catch (error) {
      handleMultiplayerSocketError(socket, 'reject_join_request', error);
    }
  });

  //  Toggle Ready State
  socket.on('toggle_ready', (payload) => {
    try {
      if (!applySocketRateLimit(socket, 'toggle_ready')) return;

      const parseResult = ToggleReadySchema.safeParse(payload);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.issues[0]?.message || 'Invalid toggle_ready payload');
      }

      const { roomCode, isReady } = parseResult.data;
      const { room, player, allReady } = multiplayerService.toggleReady(user.id, roomCode, isReady);

      io.to(`race:${roomCode}`).emit('player_ready_status', {
        roomCode,
        userId: player.userId,
        isReady: player.isReady,
        allReady,
      });
    } catch (error) {
      handleMultiplayerSocketError(socket, 'toggle_ready', error);
    }
  });

  //  Start Race Countdown (Host Only)
  socket.on('start_race_countdown', (payload) => {
    try {
      if (!applySocketRateLimit(socket, 'start_race_countdown')) return;

      const parseResult = StartRaceCountdownSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.issues[0]?.message || 'Invalid start_race_countdown payload');
      }

      const { roomCode } = parseResult.data;

      multiplayerService.startCountdown(
        user.id,
        roomCode,
        (secondsRemaining) => {
          io.to(`race:${roomCode}`).emit('countdown_tick', {
            roomCode,
            secondsRemaining,
          });
        },
        () => {
          const room = multiplayerService.getRoom(roomCode);
          if (room) {
            io.to(`race:${roomCode}`).emit('race_started', {
              roomCode,
              textPrompt: room.textPrompt,
              promptId: room.promptId,
              characterCount: room.characterCount,
              raceStartedAt: room.raceStartedAt || Date.now(),
            });
          }
        }
      );
    } catch (error) {
      handleMultiplayerSocketError(socket, 'start_race_countdown', error);
    }
  });

  //  Multiplayer Typing Progress & Anti-Cheat
  socket.on('multiplayer_typing_progress', (payload) => {
    try {
      if (!applySocketRateLimit(socket, 'multiplayer_typing_progress')) return;

      const parseResult = MultiplayerTypingProgressSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.issues[0]?.message || 'Invalid multiplayer_typing_progress payload');
      }

      const { roomCode, typedIndex, correctCharacters } = parseResult.data;
      const { room, player, isFirstToFinish, isAllFinished } = multiplayerService.processProgress(
        user.id,
        roomCode,
        typedIndex,
        correctCharacters
      );

      const playersSummary = Array.from(room.players.values()).map((p) =>
        multiplayerService.toPlayerSummary(p)
      );

      io.to(`race:${roomCode}`).emit('multiplayer_progress_update', {
        roomCode,
        players: playersSummary,
      });

      if (player.isCompleted) {
        io.to(`race:${roomCode}`).emit('player_finished', {
          roomCode,
          userId: player.userId,
          rank: player.rank || 1,
          wpm: player.wpm,
          accuracy: player.accuracy,
          totalTimeMs: player.finishTimeMs || 0,
        });

        if (isFirstToFinish) {
          // Schedule a 30-second grace timer for remaining players to finish
          multiplayerService.scheduleGraceTimeout(roomCode, 30000, () => {
            triggerRaceCompletion(roomCode);
          });
        }
      }

      if (isAllFinished) {
        triggerRaceCompletion(roomCode);
      }
    } catch (error) {
      handleMultiplayerSocketError(socket, 'multiplayer_typing_progress', error);
    }
  });

  // Explicit Leave Room
  socket.on('leave_room', (payload) => {
    try {
      if (!applySocketRateLimit(socket, 'leave_room')) return;

      const parseResult = LeaveRoomSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.issues[0]?.message || 'Invalid leave_room payload');
      }

      const { roomCode } = parseResult.data;
      socket.leave(`race:${roomCode}`);

      const { playerLeft, newHostUserId, newHostUsername, isRoomEmpty } =
        multiplayerService.handleDisconnect(socket.id, user.id);

      if (!isRoomEmpty && playerLeft) {
        io.to(`race:${roomCode}`).emit('player_left', {
          roomCode,
          userId: playerLeft.userId,
          username: playerLeft.username,
          newHostUserId,
        });

        if (newHostUserId && newHostUsername) {
          io.to(`race:${roomCode}`).emit('host_changed', {
            roomCode,
            newHostUserId,
            newHostUsername,
          });
        }
      }
    } catch (error) {
      handleMultiplayerSocketError(socket, 'leave_room', error);
    }
  });

  // Disconnect Handling & Host Migration
  socket.on('disconnect', (reason) => {
    defaultSocketRateLimiter.removeSocket(socket.id);

    const { roomCode, playerLeft, newHostUserId, newHostUsername, isRoomEmpty } =
      multiplayerService.handleDisconnect(socket.id, user.id);

    if (roomCode && !isRoomEmpty && playerLeft) {
      io.to(`race:${roomCode}`).emit('player_left', {
        roomCode,
        userId: playerLeft.userId,
        username: playerLeft.username,
        newHostUserId,
      });

      if (newHostUserId && newHostUsername) {
        io.to(`race:${roomCode}`).emit('host_changed', {
          roomCode,
          newHostUserId,
          newHostUsername,
        });
      }
    }

    logger.info('WebSocket client disconnected from multiplayer', {
      socketId: socket.id,
      userId: user.id,
      reason,
    });
  });
}

function handleMultiplayerSocketError(socket: Socket, eventName: string, error: any): void {
  const timestamp = Date.now();

  if (error instanceof InvalidInviteTokenError || error instanceof ExpiredInviteTokenError) {
    logger.warn(`Invite token failure in event '${eventName}'`, {
      socketId: socket.id,
      code: error.code,
      message: error.message,
    });

    socket.emit('error_event', {
      code: error.code,
      message: error.message,
      timestamp,
    });
  } else if (error instanceof AntiCheatError) {
    logger.warn(`Anti-cheat violation in multiplayer event '${eventName}'`, {
      socketId: socket.id,
      userId: socket.data.user?.id,
      error: error.message,
    });

    socket.emit('error_event', {
      code: 'ANTI_CHEAT_VIOLATION',
      message: 'Unnatural typing velocity detected. Multiplayer progress rejected.',
      timestamp,
    });
  } else if (error instanceof SocketError) {
    logger.warn(`Multiplayer socket operational error in event '${eventName}'`, {
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
    logger.error(`Unhandled multiplayer socket error in event '${eventName}'`, {
      socketId: socket.id,
      error: errMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    socket.emit('error_event', {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred while processing multiplayer event.',
      timestamp,
    });
  }
}
