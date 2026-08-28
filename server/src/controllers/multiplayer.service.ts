import { calculateTypingStats } from '../utils/wpmCalculator';
import { promptsService } from '../models/prompt.model';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';
import {
  generateRoomCode,
  generateInviteLink,
  verifyInviteToken,
} from '../utils/inviteLink';
import {
  RoomNotFoundError,
  RoomFullError,
  RoomStateError,
  UnauthorizedRoomActionError,
  AntiCheatError,
} from '../utils/errorResponse';
import { AuthenticatedUser } from '../models/typing.types';
import {
  MultiplayerRoom,
  RoomPlayer,
  JoinApprovalRequest,
  PlayerSummary,
  RoomSummary,
  LeaderboardEntry,
} from '../models/multiplayer.types';

export class MultiplayerService {
  private roomsMap: Map<string, MultiplayerRoom> = new Map();
  private socketToRoomMap: Map<string, string> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startGarbageCollector();
  }

  public toPlayerSummary(player: RoomPlayer): PlayerSummary {
    return {
      userId: player.userId,
      username: player.username,
      isHost: player.isHost,
      isReady: player.isReady,
      status: player.status,
      wpm: player.wpm,
      wps: player.wps,
      accuracy: player.accuracy,
      progressPercent: player.progressPercent,
      isCompleted: player.isCompleted,
      rank: player.rank,
    };
  }

  public toRoomSummary(room: MultiplayerRoom): RoomSummary {
    const playersArray = Array.from(room.players.values()).map((p) => this.toPlayerSummary(p));
    return {
      roomCode: room.roomCode,
      inviteLink: room.inviteLink,
      hostUserId: room.hostUserId,
      maxCapacity: room.maxCapacity,
      status: room.status,
      promptId: room.promptId,
      characterCount: room.characterCount,
      players: playersArray,
      pendingApprovalsCount: room.approvalQueue.size,
      createdAt: room.createdAt,
    };
  }

  
    // Creates a new multiplayer race room with signed invite link.
   
  public createRoom(
    hostUser: AuthenticatedUser,
    socketId: string,
    maxCapacity: number = 5,
    targetPromptId?: string
  ): { room: MultiplayerRoom; summary: RoomSummary } {
    let roomCode = generateRoomCode();
    let retries = 0;
    while (this.roomsMap.has(roomCode) && retries < 10) {
      roomCode = generateRoomCode();
      retries++;
    }

    const { inviteLink, inviteToken } = generateInviteLink(roomCode);
    const prompt = targetPromptId
      ? promptsService.getPromptById(targetPromptId) || promptsService.getRandomPrompt()
      : promptsService.getRandomPrompt();

    const now = Date.now();

    const hostPlayer: RoomPlayer = {
      userId: hostUser.id,
      username: hostUser.username,
      socketId,
      isHost: true,
      isReady: true,
      status: 'APPROVED',
      typedIndex: 0,
      correctCharacters: 0,
      wpm: 0,
      wps: 0,
      accuracy: 100,
      progressPercent: 0,
      isCompleted: false,
      lastTypedIndex: 0,
      lastTickTime: now,
      joinedAt: now,
    };

    const room: MultiplayerRoom = {
      roomCode,
      inviteLink,
      inviteToken,
      hostUserId: hostUser.id,
      maxCapacity,
      status: 'WAITING',
      promptId: prompt.id,
      textPrompt: prompt.content,
      characterCount: prompt.characterCount,
      players: new Map([[hostUser.id, hostPlayer]]),
      approvalQueue: new Map(),
      createdAt: now,
      lastActiveTime: now,
      nextRank: 1,
    };

    this.roomsMap.set(roomCode, room);
    this.socketToRoomMap.set(socketId, roomCode);

    logger.info('Multiplayer room created', {
      roomCode,
      hostUserId: hostUser.id,
      maxCapacity,
      promptId: prompt.id,
    });

    return { room, summary: this.toRoomSummary(room) };
  }

  
  //  Registers a join request into the room's PENDING_APPROVAL admission control queue after token verification.
   
  public requestJoinRoom(
    roomCode: string,
    user: AuthenticatedUser,
    socketId: string,
    token?: string
  ): { room: MultiplayerRoom; hostSocketId?: string | undefined; request: JoinApprovalRequest } {
    const room = this.roomsMap.get(roomCode);
    if (!room) {
      throw new RoomNotFoundError(roomCode);
    }

    // Verify HMAC signed token if provided
    if (token) {
      verifyInviteToken(roomCode, token);
    }

    if (room.status !== 'WAITING') {
      throw new RoomStateError(`Cannot join room '${roomCode}' because race is ${room.status.toLowerCase()}.`);
    }

    if (room.players.size + room.approvalQueue.size >= room.maxCapacity) {
      throw new RoomFullError(roomCode);
    }

    // Check if user is already an approved member
    const existingPlayer = room.players.get(user.id);
    if (existingPlayer) {
      existingPlayer.socketId = socketId;
      this.socketToRoomMap.set(socketId, roomCode);
      return {
        room,
        hostSocketId: room.players.get(room.hostUserId)?.socketId,
        request: {
          userId: user.id,
          username: user.username,
          socketId,
          requestedAt: Date.now(),
        },
      };
    }

    const request: JoinApprovalRequest = {
      userId: user.id,
      username: user.username,
      socketId,
      requestedAt: Date.now(),
    };

    room.approvalQueue.set(user.id, request);
    room.lastActiveTime = Date.now();

    const hostPlayer = room.players.get(room.hostUserId);

    logger.info('Join approval requested', {
      roomCode,
      requesterUserId: user.id,
      hostUserId: room.hostUserId,
    });

    return {
      room,
      hostSocketId: hostPlayer?.socketId,
      request,
    };
  }

    // Host approves a pending join request.
   
  public approveJoinRequest(
    hostUserId: string,
    roomCode: string,
    requesterUserId: string
  ): { room: MultiplayerRoom; approvedPlayer: RoomPlayer; requesterSocketId: string } {
    const room = this.roomsMap.get(roomCode);
    if (!room) {
      throw new RoomNotFoundError(roomCode);
    }

    if (room.hostUserId !== hostUserId) {
      throw new UnauthorizedRoomActionError('Only the room host can approve join requests.');
    }

    const request = room.approvalQueue.get(requesterUserId);
    if (!request) {
      throw new RoomStateError(`Pending join request for user '${requesterUserId}' not found.`);
    }

    if (room.players.size >= room.maxCapacity) {
      room.approvalQueue.delete(requesterUserId);
      throw new RoomFullError(roomCode);
    }

    room.approvalQueue.delete(requesterUserId);
    const now = Date.now();

    const approvedPlayer: RoomPlayer = {
      userId: request.userId,
      username: request.username,
      socketId: request.socketId,
      isHost: false,
      isReady: false,
      status: 'APPROVED',
      typedIndex: 0,
      correctCharacters: 0,
      wpm: 0,
      wps: 0,
      accuracy: 100,
      progressPercent: 0,
      isCompleted: false,
      lastTypedIndex: 0,
      lastTickTime: now,
      joinedAt: now,
    };

    room.players.set(request.userId, approvedPlayer);
    this.socketToRoomMap.set(request.socketId, roomCode);
    room.lastActiveTime = now;

    logger.info('Join request approved by host', {
      roomCode,
      hostUserId,
      approvedUserId: request.userId,
    });

    return {
      room,
      approvedPlayer,
      requesterSocketId: request.socketId,
    };
  }

  
  //  Host rejects a pending join request.
   
  public rejectJoinRequest(
    hostUserId: string,
    roomCode: string,
    requesterUserId: string,
    reason?: string
  ): { requesterSocketId: string; reason: string } {
    const room = this.roomsMap.get(roomCode);
    if (!room) {
      throw new RoomNotFoundError(roomCode);
    }

    if (room.hostUserId !== hostUserId) {
      throw new UnauthorizedRoomActionError('Only the room host can reject join requests.');
    }

    const request = room.approvalQueue.get(requesterUserId);
    if (!request) {
      throw new RoomStateError(`Pending join request for user '${requesterUserId}' not found.`);
    }

    room.approvalQueue.delete(requesterUserId);
    room.lastActiveTime = Date.now();

    logger.info('Join request rejected by host', {
      roomCode,
      hostUserId,
      rejectedUserId: requesterUserId,
      reason,
    });

    return {
      requesterSocketId: request.socketId,
      reason: reason || 'Your request to join the race room was rejected by the host.',
    };
  }

  
  //  Player toggles ready state.
   
  public toggleReady(
    userId: string,
    roomCode: string,
    isReady: boolean
  ): { room: MultiplayerRoom; player: RoomPlayer; allReady: boolean } {
    const room = this.roomsMap.get(roomCode);
    if (!room) {
      throw new RoomNotFoundError(roomCode);
    }

    const player = room.players.get(userId);
    if (!player) {
      throw new RoomStateError(`User '${userId}' is not a participant in room '${roomCode}'.`);
    }

    if (room.status !== 'WAITING') {
      throw new RoomStateError('Cannot change ready state after countdown or race has started.');
    }

    player.isReady = isReady;
    player.status = isReady ? 'READY' : 'APPROVED';
    room.lastActiveTime = Date.now();

    const allReady = Array.from(room.players.values()).every((p) => p.isReady);

    return { room, player, allReady };
  }

  
    // Initiates synchronized 5-second countdown timer.
   
  public startCountdown(
    hostUserId: string,
    roomCode: string,
    onTick: (secondsRemaining: number) => void,
    onStart: () => void
  ): void {
    const room = this.roomsMap.get(roomCode);
    if (!room) {
      throw new RoomNotFoundError(roomCode);
    }

    if (room.hostUserId !== hostUserId) {
      throw new UnauthorizedRoomActionError('Only the room host can start the race countdown.');
    }

    if (room.status !== 'WAITING') {
      throw new RoomStateError(`Countdown cannot be started when room status is '${room.status}'.`);
    }

    room.status = 'COUNTDOWN';
    room.lastActiveTime = Date.now();

    let secondsRemaining = 5;
    onTick(secondsRemaining);

    if (room.countdownTimer) {
      clearInterval(room.countdownTimer);
    }

    room.countdownTimer = setInterval(() => {
      secondsRemaining--;

      if (secondsRemaining > 0) {
        onTick(secondsRemaining);
      } else {
        if (room.countdownTimer) {
          clearInterval(room.countdownTimer);
          room.countdownTimer = null;
        }

        onTick(0);

        const now = Date.now();
        room.status = 'IN_PROGRESS';
        room.raceStartedAt = now;
        room.nextRank = 1;

        for (const player of room.players.values()) {
          player.status = 'TYPING';
          player.lastTickTime = now;
        }

        logger.info('Multiplayer race started', {
          roomCode,
          participantCount: room.players.size,
          raceStartedAt: now,
        });

        onStart();
      }
    }, 1000);
  }

  
  //  Evaluates live typing progress for a player in a race and performing anti-cheat checks.
   
  public processProgress(
    userId: string,
    roomCode: string,
    typedIndex: number,
    correctCharacters: number
  ): {
    room: MultiplayerRoom;
    player: RoomPlayer;
    isFirstToFinish: boolean;
    isAllFinished: boolean;
  } {
    const room = this.roomsMap.get(roomCode);
    if (!room) {
      throw new RoomNotFoundError(roomCode);
    }

    if (room.status !== 'IN_PROGRESS') {
      throw new RoomStateError(`Keystroke submission rejected: Race in room '${roomCode}' is not in progress.`);
    }

    const player = room.players.get(userId);
    if (!player) {
      throw new RoomStateError(`User '${userId}' is not a participant in room '${roomCode}'.`);
    }

    if (player.isCompleted) {
      return {
        room,
        player,
        isFirstToFinish: false,
        isAllFinished: Array.from(room.players.values()).every((p) => p.isCompleted),
      };
    }

    const now = Date.now();

    if (typedIndex < 0 || typedIndex > room.characterCount) {
      throw new AntiCheatError(`Invalid typedIndex boundaries: ${typedIndex}`);
    }

    const charDelta = typedIndex - player.lastTypedIndex;
    const timeDeltaMs = Math.max(1, now - player.lastTickTime);
    const instantWpm = (charDelta / 5) / (timeDeltaMs / 60000);

    // Anti-cheat velocity check: charDelta > 8 in < 200ms OR instant WPM > 250
    if ((charDelta > 8 && timeDeltaMs < 200) || (timeDeltaMs >= 100 && instantWpm > 250)) {
      logger.warn('Multiplayer anti-cheat threshold exceeded', {
        roomCode,
        userId,
        charDelta,
        timeDeltaMs,
        instantWpm: Math.round(instantWpm),
      });

      throw new AntiCheatError('Automated typing velocity threshold exceeded.');
    }

    player.lastTypedIndex = typedIndex;
    player.lastTickTime = now;

    const stats = calculateTypingStats(
      typedIndex,
      correctCharacters,
      room.characterCount,
      room.raceStartedAt || now,
      now
    );

    player.typedIndex = typedIndex;
    player.correctCharacters = Math.min(typedIndex, correctCharacters);
    player.wpm = stats.wpm;
    player.wps = stats.wps;
    player.accuracy = stats.accuracy;
    player.progressPercent = stats.progressPercent;
    room.lastActiveTime = now;

    let isFirstToFinish = false;

    if (stats.isCompleted) {
      player.isCompleted = true;
      player.status = 'FINISHED';
      player.finishTimeMs = now - (room.raceStartedAt || now);
      player.rank = room.nextRank;
      room.nextRank++;

      if (player.rank === 1) {
        isFirstToFinish = true;
      }

      logger.info('Player finished multiplayer race', {
        roomCode,
        userId,
        rank: player.rank,
        wpm: player.wpm,
        accuracy: player.accuracy,
      });
    }

    const isAllFinished = Array.from(room.players.values()).every((p) => p.isCompleted);

    return {
      room,
      player,
      isFirstToFinish,
      isAllFinished,
    };
  }

  
  //  Finalizes match state and produces leaderboard summary.
  
  public completeRace(roomCode: string): { room: MultiplayerRoom; leaderboard: LeaderboardEntry[] } {
    const room = this.roomsMap.get(roomCode);
    if (!room) {
      throw new RoomNotFoundError(roomCode);
    }

    if (room.countdownTimer) {
      clearInterval(room.countdownTimer);
      room.countdownTimer = null;
    }

    if (room.graceTimer) {
      clearTimeout(room.graceTimer);
      room.graceTimer = null;
    }

    room.status = 'COMPLETED';
    room.raceEndedAt = Date.now();
    const raceDurationMs = room.raceStartedAt ? room.raceEndedAt - room.raceStartedAt : 0;

    const playersList = Array.from(room.players.values());

    // Sort leaderboard: completed players by rank then uncompleted by progressPercent & WPM
    playersList.sort((a, b) => {
      if (a.isCompleted && b.isCompleted) {
        return (a.rank || 99) - (b.rank || 99);
      }
      if (a.isCompleted) return -1;
      if (b.isCompleted) return 1;
      return b.progressPercent - a.progressPercent || b.wpm - a.wpm;
    });

    const leaderboard: LeaderboardEntry[] = playersList.map((p, index) => ({
      rank: p.rank || index + 1,
      userId: p.userId,
      username: p.username,
      wpm: p.wpm,
      accuracy: p.accuracy,
      totalTimeMs: p.finishTimeMs || raceDurationMs,
    }));

    logger.info('Multiplayer race completed', {
      roomCode,
      raceDurationMs,
      leaderboardCount: leaderboard.length,
    });

    return { room, leaderboard };
  }

  
    // Schedules match end grace period timer (e.g. 30 seconds after first finisher).
   
  public scheduleGraceTimeout(
    roomCode: string,
    timeoutMs: number = 30000,
    onGraceExpired: () => void
  ): void {
    const room = this.roomsMap.get(roomCode);
    if (!room || room.graceTimer) return;

    room.graceTimer = setTimeout(() => {
      onGraceExpired();
    }, timeoutMs);
  }

  
    // Handles user disconnect or explicit room departure.
    // Transfers host authority seamlessly if host disconnects.
   
  public handleDisconnect(
    socketId: string,
    userId?: string
  ): {
    roomCode?: string | undefined;
    playerLeft?: RoomPlayer | undefined;
    newHostUserId?: string | undefined;
    newHostUsername?: string | undefined;
    isRoomEmpty?: boolean | undefined;
  } {
    const roomCode = this.socketToRoomMap.get(socketId);
    this.socketToRoomMap.delete(socketId);

    if (!roomCode) {
      // Check if user has pending approval requests across any room
      if (userId) {
        for (const room of this.roomsMap.values()) {
          if (room.approvalQueue.has(userId)) {
            room.approvalQueue.delete(userId);
          }
        }
      }
      return {};
    }

    const room = this.roomsMap.get(roomCode);
    if (!room) return {};

    const targetUserId = userId || Array.from(room.players.values()).find((p) => p.socketId === socketId)?.userId;
    if (!targetUserId) return { roomCode };

    const playerLeft = room.players.get(targetUserId);
    room.players.delete(targetUserId);
    room.approvalQueue.delete(targetUserId);

    if (room.players.size === 0) {
      if (room.countdownTimer) clearInterval(room.countdownTimer);
      if (room.graceTimer) clearTimeout(room.graceTimer);
      this.roomsMap.delete(roomCode);

      logger.info('Room closed (all participants left)', { roomCode });
      return { roomCode, playerLeft, isRoomEmpty: true };
    }

    let newHostUserId: string | undefined;
    let newHostUsername: string | undefined;

    // If host left, transfer host role to oldest remaining player
    if (room.hostUserId === targetUserId) {
      const oldestRemainingPlayer = Array.from(room.players.values()).sort((a, b) => a.joinedAt - b.joinedAt)[0];
      if (oldestRemainingPlayer) {
        oldestRemainingPlayer.isHost = true;
        room.hostUserId = oldestRemainingPlayer.userId;
        newHostUserId = oldestRemainingPlayer.userId;
        newHostUsername = oldestRemainingPlayer.username;

        logger.info('Host role transferred', {
          roomCode,
          oldHostUserId: targetUserId,
          newHostUserId,
        });
      }
    }

    return {
      roomCode,
      playerLeft,
      newHostUserId,
      newHostUsername,
      isRoomEmpty: false,
    };
  }

  public getRoom(roomCode: string): MultiplayerRoom | undefined {
    return this.roomsMap.get(roomCode);
  }

  public getActiveRoomsCount(): number {
    return this.roomsMap.size;
  }

   
  private startGarbageCollector(): void {
    const intervalMs = env.CLEANUP_INTERVAL_MINUTES * 60 * 1000;
    const ttlMs = env.SESSION_TTL_MINUTES * 60 * 1000;

    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let purgedCount = 0;

      for (const [roomCode, room] of this.roomsMap.entries()) {
        const inactiveDuration = now - room.lastActiveTime;
        if (inactiveDuration > ttlMs) {
          if (room.countdownTimer) clearInterval(room.countdownTimer);
          if (room.graceTimer) clearTimeout(room.graceTimer);

          for (const player of room.players.values()) {
            this.socketToRoomMap.delete(player.socketId);
          }

          this.roomsMap.delete(roomCode);
          purgedCount++;
        }
      }

      if (purgedCount > 0) {
        logger.info('Multiplayer GC completed', {
          purgedRoomsCount: purgedCount,
          remainingRooms: this.roomsMap.size,
        });
      }
    }, intervalMs);

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  public stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

export const multiplayerService = new MultiplayerService();
