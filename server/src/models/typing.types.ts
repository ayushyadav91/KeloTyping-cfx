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

import {
  MultiplayerClientToServerEvents,
  MultiplayerServerToClientEvents,
} from './multiplayer.types';

export interface ClientToServerEvents
  extends MultiplayerClientToServerEvents {
  start_solo_session: (payload?: StartSoloSessionPayload) => void;
  typing_progress: (payload: TypingProgressPayload) => void;
}

export interface ServerToClientEvents
  extends MultiplayerServerToClientEvents {
  session_started: (payload: SessionStartedPayload) => void;
  stats_update: (payload: StatsUpdatePayload) => void;
  session_summary: (payload: SessionSummaryPayload) => void;
  error_event: (payload: SocketErrorPayload) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user?: AuthenticatedUser;
  userId?: string;
  username?: string;
  lastProgressTimestamp?: number;
  lastTypedIndex?: number;
  roomCode?: string;
}

