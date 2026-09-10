import { TypingStats } from '../utils/wpmCalculator';

export interface AuthenticatedUser {
  id: string;
  username: string;
}

export interface SoloSession {
  sessionId: string;
  userId: string;
  promptId: string;
  textPrompt: string;
  characterCount: number;
  startTime: number;
  endTime?: number;
  lastActiveTime: number;
  lastTickTime: number;
  lastTypedIndex: number;
  isCompleted: boolean;
  typedIndex: number;
  correctCharacters: number;
  stats: TypingStats;
}

export interface StartSoloSessionPayload {
  promptId?: string;
}

export interface TypingProgressPayload {
  sessionId: string;
  typedIndex: number;
  correctCharacters: number;
}

export interface SessionStartedPayload {
  sessionId: string;
  textPrompt: string;
  characterCount: number;
  startTime: number;
}

export interface StatsUpdatePayload {
  sessionId: string;
  typedIndex: number;
  correctCharacters: number;
  wpm: number;
  wps: number;
  accuracy: number;
  progressPercent: number;
  elapsedTimeMs: number;
  isCompleted: boolean;
}

export interface SessionSummaryPayload {
  sessionId: string;
  finalWpm: number;
  finalWps: number;
  finalAccuracy: number;
  totalTimeMs: number;
  completedAt: number;
}

export interface SocketErrorPayload {
  code: string;
  message: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Multiplayer rooms
// ---------------------------------------------------------------------------

export type RoomStatus = 'waiting' | 'countdown' | 'racing' | 'finished';

export interface RoomPlayerView {
  userId: string;
  username: string;
  isHost: boolean;
  isReady: boolean;
  wpm: number;
  accuracy: number;
  progressPercent: number;
  placement: number | null;
  finished: boolean;
  connected: boolean;
}

export interface RoomStatePayload {
  roomId: string;
  code: string;
  status: RoomStatus;
  hostId: string;
  maxPlayers: number;
  promptId: string | null;
  characterCount: number | null;
  players: RoomPlayerView[];
}

export interface CreateRoomPayload {
  maxPlayers?: number;
}

export interface JoinRoomPayload {
  code: string;
}

export interface RaceProgressPayload {
  typedIndex: number;
  correctCharacters: number;
}

export interface RoomCountdownPayload {
  roomId: string;
  secondsRemaining: number;
}

export interface RaceStartedPayload {
  roomId: string;
  promptId: string;
  textPrompt: string;
  characterCount: number;
  startTime: number;
}

export interface RaceProgressUpdatePayload {
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
  progressPercent: number;
}

export interface PlayerFinishedPayload {
  roomId: string;
  userId: string;
  username: string;
  placement: number;
  wpm: number;
  accuracy: number;
}

export interface RaceSummaryPayload {
  roomId: string;
  matchId: string | null;
  results: Array<{
    userId: string;
    username: string;
    placement: number | null;
    wpm: number;
    accuracy: number;
    finished: boolean;
  }>;
}

export interface ClientToServerEvents {
  start_solo_session: (payload?: StartSoloSessionPayload) => void;
  typing_progress: (payload: TypingProgressPayload) => void;

  create_room: (payload?: CreateRoomPayload) => void;
  join_room: (payload: JoinRoomPayload) => void;
  leave_room: () => void;
  toggle_ready: () => void;
  race_progress: (payload: RaceProgressPayload) => void;
}

export interface ServerToClientEvents {
  session_started: (payload: SessionStartedPayload) => void;
  stats_update: (payload: StatsUpdatePayload) => void;
  session_summary: (payload: SessionSummaryPayload) => void;
  error_event: (payload: SocketErrorPayload) => void;

  room_state: (payload: RoomStatePayload) => void;
  room_countdown: (payload: RoomCountdownPayload) => void;
  race_started: (payload: RaceStartedPayload) => void;
  race_progress_update: (payload: RaceProgressUpdatePayload) => void;
  player_finished: (payload: PlayerFinishedPayload) => void;
  race_summary: (payload: RaceSummaryPayload) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user?: AuthenticatedUser;
  lastProgressTimestamp?: number;
  lastTypedIndex?: number;
  roomId?: string;
}

