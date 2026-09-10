export interface User {
  id: string;
  username: string;
  email: string;
  avatarInitial: string;
  joinedDate: string;
  bio?: string;
  bestWpm?: number;
}

export interface TestResult {
  id: string;
  wpm: number;
  accuracy: number;
  errors: number;
  streak: number;
  rawWpm: number;
  time: number;
  chars: number;
  mode: TypingMode;
  wpmOverTime: number[];
  keyErrors: Record<string, number>;
  date: string;
  duration?: number;
  totalTyped?: number;
}

export interface MultiResult {
  id: string;
  roomCode: string;
  matchMode: 'private' | 'quick';
  opponentName: string;
  userWpm: number;
  opponentWpm: number;
  userAccuracy: number;
  opponentAccuracy: number;
  winner: 'user' | 'opponent' | 'draw';
  date: string;
}

export type TypingMode = 'common-words' | 'quotes' | 'custom-text';
export type TimeDuration = 15 | 30 | 60 | 120;

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  wpm: number;
  accuracy: number;
  streak: number;
  country: string;
  isUser?: boolean;
  isGhost?: boolean;
}

export interface Room {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  currentPlayers: number;
  maxPlayers: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'danger';
}
