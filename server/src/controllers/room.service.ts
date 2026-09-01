import { randomBytes } from 'crypto';
import { promptsService, TextPrompt } from '../models/prompt.model';
import { calculateTypingStats } from '../utils/wpmCalculator';
import { RoomError, SessionNotFoundError } from '../utils/errorResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env.config';
import Match from '../models/match.model';
import User from '../models/user.model';
import {
  RoomPlayerView,
  RoomStatePayload,
  RoomStatus,
} from '../models/typing.types';

interface InternalPlayer {
  userId: string;
  username: string;
  isHost: boolean;
  isReady: boolean;
  connected: boolean;
  // race telemetry
  typedIndex: number;
  correctCharacters: number;
  lastTypedIndex: number;
  lastTickTime: number;
  wpm: number;
  accuracy: number;
  progressPercent: number;
  placement: number | null;
  finished: boolean;
  finishedAt: number | null;
}

interface InternalRoom {
  roomId: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  maxPlayers: number;
  prompt: TextPrompt | null;
  startTime: number | null;
  createdAt: number;
  lastActiveAt: number;
  finishOrder: number;
  players: Map<string, InternalPlayer>;
  countdownTimer: NodeJS.Timeout | null;
  raceFinalizeTimer: NodeJS.Timeout | null;
}

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

const generateRoomCode = (): string => {
  const bytes = randomBytes(5);
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += ROOM_CODE_ALPHABET[bytes[i]! % ROOM_CODE_ALPHABET.length];
  }
  return code;
};

const MIN_PLAYERS_TO_START = 2;

export class RoomService {
  private rooms: Map<string, InternalRoom> = new Map();
  private codeIndex: Map<string, string> = new Map(); // code -> roomId
  private userRoomIndex: Map<string, string> = new Map(); // userId -> roomId
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startIdleReaper();
  }

  // -------------------------------------------------------------------
  // Room lifecycle
  // -------------------------------------------------------------------

  public createRoom(hostId: string, hostUsername: string, maxPlayers?: number): InternalRoom {
    this.leaveCurrentRoom(hostId);

    let code = generateRoomCode();
    while (this.codeIndex.has(code)) code = generateRoomCode();

    const roomId = `room_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const now = Date.now();

    const room: InternalRoom = {
      roomId,
      code,
      hostId,
      status: 'waiting',
      maxPlayers: Math.min(Math.max(maxPlayers || env.ROOM_MAX_PLAYERS, MIN_PLAYERS_TO_START), 12),
      prompt: null,
      startTime: null,
      createdAt: now,
      lastActiveAt: now,
      finishOrder: 0,
      players: new Map(),
      countdownTimer: null,
      raceFinalizeTimer: null,
    };

    room.players.set(hostId, this.newPlayer(hostId, hostUsername, true));

    this.rooms.set(roomId, room);
    this.codeIndex.set(code, roomId);
    this.userRoomIndex.set(hostId, roomId);

    logger.info('Room created', { roomId, code, hostId });
    return room;
  }

  public joinRoom(code: string, userId: string, username: string): InternalRoom {
    const roomId = this.codeIndex.get(code.toUpperCase());
    const room = roomId ? this.rooms.get(roomId) : undefined;
    if (!room) throw new RoomError('Room not found. Check the code and try again.', 'ROOM_NOT_FOUND');

    if (room.players.has(userId)) {
      const existing = room.players.get(userId)!;
      existing.connected = true;
      room.lastActiveAt = Date.now();
      this.userRoomIndex.set(userId, room.roomId);
      return room;
    }

    if (room.status !== 'waiting') {
      throw new RoomError('Race already in progress. Wait for it to finish.', 'ROOM_IN_PROGRESS');
    }
    if (room.players.size >= room.maxPlayers) {
      throw new RoomError('Room is full.', 'ROOM_FULL');
    }

    this.leaveCurrentRoom(userId);

    room.players.set(userId, this.newPlayer(userId, username, false));
    room.lastActiveAt = Date.now();
    this.userRoomIndex.set(userId, room.roomId);

    logger.info('Player joined room', { roomId: room.roomId, code: room.code, userId });
    return room;
  }

  public leaveCurrentRoom(userId: string): InternalRoom | null {
    const roomId = this.userRoomIndex.get(userId);
    if (!roomId) return null;
    return this.leaveRoom(roomId, userId);
  }

  public leaveRoom(roomId: string, userId: string): InternalRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players.delete(userId);
    this.userRoomIndex.delete(userId);

    if (room.players.size === 0) {
      this.destroyRoom(room.roomId);
      return null;
    }

    if (room.hostId === userId) {
      const nextHost = room.players.values().next().value as InternalPlayer;
      room.hostId = nextHost.userId;
      nextHost.isHost = true;
    }

    room.lastActiveAt = Date.now();
    logger.info('Player left room', { roomId, userId });
    return room;
  }

  /** Marks a player disconnected without removing them (grace period for reconnects during a race). */
  public markDisconnected(userId: string): InternalRoom | null {
    const roomId = this.userRoomIndex.get(userId);
    if (!roomId) return null;
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.get(userId);
    if (!player) return null;

    if (room.status === 'racing') {
      player.connected = false;
      room.lastActiveAt = Date.now();
      return room;
    }

    // Not racing: just remove them outright.
    return this.leaveRoom(roomId, userId);
  }

  public toggleReady(roomId: string, userId: string): InternalRoom {
    const room = this.getRoomOrThrow(roomId);
    if (room.status !== 'waiting') throw new RoomError('Race already started.', 'ROOM_IN_PROGRESS');

    const player = room.players.get(userId);
    if (!player) throw new RoomError('You are not in this room.', 'NOT_IN_ROOM');

    player.isReady = !player.isReady;
    room.lastActiveAt = Date.now();
    return room;
  }

  public canStart(room: InternalRoom): boolean {
    if (room.status !== 'waiting') return false;
    if (room.players.size < MIN_PLAYERS_TO_START) return false;
    return Array.from(room.players.values()).every((p) => p.isReady);
  }

  public beginCountdown(roomId: string, onTick: (secondsRemaining: number) => void, onComplete: () => void): void {
    const room = this.getRoomOrThrow(roomId);
    if (room.countdownTimer) return; // already counting down

    room.status = 'countdown';
    let remaining = env.ROOM_COUNTDOWN_SECONDS;
    onTick(remaining);

    room.countdownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (room.countdownTimer) clearInterval(room.countdownTimer);
        room.countdownTimer = null;
        onComplete();
        return;
      }
      onTick(remaining);
    }, 1000);
  }

  public startRace(roomId: string): InternalRoom {
    const room = this.getRoomOrThrow(roomId);
    const prompt = promptsService.getRandomPrompt();
    const now = Date.now();

    room.prompt = prompt;
    room.status = 'racing';
    room.startTime = now;
    room.finishOrder = 0;

    for (const player of room.players.values()) {
      player.typedIndex = 0;
      player.correctCharacters = 0;
      player.lastTypedIndex = 0;
      player.lastTickTime = now;
      player.wpm = 0;
      player.accuracy = 100;
      player.progressPercent = 0;
      player.placement = null;
      player.finished = false;
      player.finishedAt = null;
    }

    logger.info('Race started', { roomId, promptId: prompt.id, players: room.players.size });
    return room;
  }

  /**
   * Applies a progress tick for one player within a racing room, enforcing the
   * same anti-cheat velocity rules as the solo engine (per-player, not global).
   */
  public processRaceProgress(
    roomId: string,
    userId: string,
    typedIndex: number,
    correctCharacters: number
  ): { room: InternalRoom; player: InternalPlayer; justFinished: boolean } {
    const room = this.getRoomOrThrow(roomId);
    if (room.status !== 'racing' || !room.prompt || !room.startTime) {
      throw new RoomError('Race is not currently active.', 'RACE_NOT_ACTIVE');
    }

    const player = room.players.get(userId);
    if (!player) throw new SessionNotFoundError(roomId);
    if (player.finished) return { room, player, justFinished: false };

    const characterCount = room.prompt.characterCount;
    if (typedIndex < 0 || typedIndex > characterCount) {
      throw new RoomError(`Invalid typedIndex boundaries: ${typedIndex}`, 'ANTI_CHEAT_TRIGGERED');
    }

    const now = Date.now();
    const charDelta = typedIndex - player.lastTypedIndex;
    const timeDeltaMs = Math.max(1, now - player.lastTickTime);
    const instantWpm = charDelta / 5 / (timeDeltaMs / 60000);

    if ((charDelta > 8 && timeDeltaMs < 200) || (timeDeltaMs >= 100 && instantWpm > 250)) {
      logger.warn('Anti-cheat threshold exceeded in room race', { roomId, userId, charDelta, timeDeltaMs });
      throw new RoomError('Automated typing velocity threshold exceeded.', 'ANTI_CHEAT_TRIGGERED');
    }

    player.lastTypedIndex = typedIndex;
    player.lastTickTime = now;

    const stats = calculateTypingStats(typedIndex, correctCharacters, characterCount, room.startTime, now);

    player.typedIndex = typedIndex;
    player.correctCharacters = Math.min(typedIndex, correctCharacters);
    player.wpm = stats.wpm;
    player.accuracy = stats.accuracy;
    player.progressPercent = stats.progressPercent;

    let justFinished = false;
    if (stats.isCompleted && !player.finished) {
      room.finishOrder += 1;
      player.finished = true;
      player.finishedAt = now;
      player.placement = room.finishOrder;
      justFinished = true;
    }

    room.lastActiveAt = now;
    return { room, player, justFinished };
  }

  public allFinished(room: InternalRoom): boolean {
    return Array.from(room.players.values()).every((p) => p.finished || !p.connected);
  }

  /** Persists the finished race to Mongo and marks the room finished. Returns the created match id. */
  public async finalizeRace(roomId: string): Promise<string | null> {
    const room = this.rooms.get(roomId);
    if (!room || !room.prompt || !room.startTime) return null;
    if (room.status === 'finished') return null;

    room.status = 'finished';
    if (room.raceFinalizeTimer) {
      clearTimeout(room.raceFinalizeTimer);
      room.raceFinalizeTimer = null;
    }

    const participants = Array.from(room.players.values()).map((p) => ({
      userId: p.userId,
      username: p.username,
      wpm: p.wpm,
      accuracy: p.accuracy,
      progressPercent: p.progressPercent,
      placement: p.placement,
      finishedAt: p.finishedAt ? new Date(p.finishedAt) : null,
      disconnected: !p.connected,
    }));

    try {
      const match = await Match.create({
        roomCode: room.code,
        promptId: room.prompt.id,
        textPrompt: room.prompt.content,
        hostId: room.hostId,
        participants,
        startedAt: new Date(room.startTime),
        finishedAt: new Date(),
      });

      const winner = participants.find((p) => p.placement === 1);
      await Promise.all(
        participants.map(async (p) => {
          const inc = { matchesPlayed: 1, matchesWon: winner?.userId === p.userId ? 1 : 0 };
          let set: { bestWpm?: number } | undefined;

          if (p.wpm > 0) {
            const user = await User.findById(p.userId).select('bestWpm');
            if (user && p.wpm > user.bestWpm) {
              set = { bestWpm: p.wpm };
            }
          }

          await User.findByIdAndUpdate(p.userId, set ? { $inc: inc, $set: set } : { $inc: inc });
        })
      );

      logger.info('Race finalized and persisted', { roomId, matchId: match._id, code: room.code });
      return match._id;
    } catch (err) {
      logger.error('Failed to persist match result', {
        roomId,
        error: err instanceof Error ? err.message : 'unknown',
      });
      return null;
    }
  }

  public scheduleFinalize(roomId: string, delayMs: number, onFinalized: (matchId: string | null) => void): void {
    const room = this.rooms.get(roomId);
    if (!room || room.raceFinalizeTimer) return;

    room.raceFinalizeTimer = setTimeout(() => {
      this.finalizeRace(roomId)
        .then(onFinalized)
        .catch((err) => logger.error('finalizeRace failed', { roomId, error: String(err) }));
    }, delayMs);
  }

  // -------------------------------------------------------------------
  // Lookups & view helpers
  // -------------------------------------------------------------------

  public getRoom(roomId: string): InternalRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomOrThrow(roomId: string): InternalRoom {
    const room = this.rooms.get(roomId);
    if (!room) throw new RoomError('Room no longer exists.', 'ROOM_NOT_FOUND');
    return room;
  }

  public getRoomIdForUser(userId: string): string | undefined {
    return this.userRoomIndex.get(userId);
  }

  public toStatePayload(room: InternalRoom): RoomStatePayload {
    const players: RoomPlayerView[] = Array.from(room.players.values()).map((p) => ({
      userId: p.userId,
      username: p.username,
      isHost: p.isHost,
      isReady: p.isReady,
      wpm: p.wpm,
      accuracy: p.accuracy,
      progressPercent: p.progressPercent,
      placement: p.placement,
      finished: p.finished,
      connected: p.connected,
    }));

    return {
      roomId: room.roomId,
      code: room.code,
      status: room.status,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      promptId: room.prompt?.id ?? null,
      characterCount: room.prompt?.characterCount ?? null,
      players,
    };
  }

  public getActiveRoomsCount(): number {
    return this.rooms.size;
  }

  // -------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------

  private newPlayer(userId: string, username: string, isHost: boolean): InternalPlayer {
    return {
      userId,
      username,
      isHost,
      isReady: isHost, // host starts ready; everyone else opts in
      connected: true,
      typedIndex: 0,
      correctCharacters: 0,
      lastTypedIndex: 0,
      lastTickTime: Date.now(),
      wpm: 0,
      accuracy: 100,
      progressPercent: 0,
      placement: null,
      finished: false,
      finishedAt: null,
    };
  }

  private destroyRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.countdownTimer) clearInterval(room.countdownTimer);
    if (room.raceFinalizeTimer) clearTimeout(room.raceFinalizeTimer);
    this.codeIndex.delete(room.code);
    this.rooms.delete(roomId);
    logger.info('Room destroyed (empty)', { roomId, code: room.code });
  }

  private startIdleReaper(): void {
    const intervalMs = env.CLEANUP_INTERVAL_MINUTES * 60 * 1000;
    const ttlMs = env.ROOM_IDLE_TTL_MINUTES * 60 * 1000;

    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const room of this.rooms.values()) {
        if (now - room.lastActiveAt > ttlMs) {
          for (const userId of room.players.keys()) this.userRoomIndex.delete(userId);
          this.destroyRoom(room.roomId);
        }
      }
    }, intervalMs);

    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  public stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

export const roomService = new RoomService();
