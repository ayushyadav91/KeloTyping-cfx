import { AuthenticatedUser } from './typing.types';

export type RoomStatus = 'WAITING' | 'COUNTDOWN' | 'IN_PROGRESS' | 'COMPLETED';

export type PlayerStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'READY'
  | 'TYPING'
  | 'FINISHED'
  | 'DISCONNECTED';

export interface RoomPlayer {
  userId: string;
  username: string;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
  status: PlayerStatus;
  typedIndex: number;
  correctCharacters: number;
  wpm: number;
  wps: number;
  accuracy: number;
  progressPercent: number;
  isCompleted: boolean;
  rank?: number | undefined;
  finishTimeMs?: number | undefined;
  lastTypedIndex: number;
  lastTickTime: number;
  joinedAt: number;
}

export interface JoinApprovalRequest {
  userId: string;
  username: string;
  socketId: string;
  requestedAt: number;
}

export interface MultiplayerRoom {
  roomCode: string;
  inviteLink: string;
  inviteToken: string;
  hostUserId: string;
  maxCapacity: number;
  status: RoomStatus;
  promptId: string;
  textPrompt: string;
  characterCount: number;
  players: Map<string, RoomPlayer>;
  approvalQueue: Map<string, JoinApprovalRequest>;
  raceStartedAt?: number | undefined;
  raceEndedAt?: number | undefined;
  countdownTimer?: NodeJS.Timeout | null | undefined;
  graceTimer?: NodeJS.Timeout | null | undefined;
  createdAt: number;
  lastActiveTime: number;
  nextRank: number;
}

export interface PlayerSummary {
  userId: string;
  username: string;
  isHost: boolean;
  isReady: boolean;
  status: PlayerStatus;
  wpm: number;
  wps: number;
  accuracy: number;
  progressPercent: number;
  isCompleted: boolean;
  rank?: number | undefined;
}

export interface RoomSummary {
  roomCode: string;
  inviteLink: string;
  hostUserId: string;
  maxCapacity: number;
  status: RoomStatus;
  promptId: string;
  characterCount: number;
  players: PlayerSummary[];
  pendingApprovalsCount: number;
  createdAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
  totalTimeMs: number;
}


export interface CreateRoomPayload {
  maxCapacity?: number | undefined;
  promptId?: string | undefined;
}

export interface JoinRoomRequestPayload {
  roomCode: string;
  token?: string | undefined;
}

export interface ApproveJoinRequestPayload {
  roomCode: string;
  requesterUserId: string;
}

export interface RejectJoinRequestPayload {
  roomCode: string;
  requesterUserId: string;
  reason?: string | undefined;
}

export interface ToggleReadyPayload {
  roomCode: string;
  isReady: boolean;
}

export interface StartRaceCountdownPayload {
  roomCode: string;
}

export interface MultiplayerTypingProgressPayload {
  roomCode: string;
  typedIndex: number;
  correctCharacters: number;
}

export interface LeaveRoomPayload {
  roomCode: string;
}

export interface RoomCreatedPayload {
  roomCode: string;
  inviteLink: string;
  inviteToken: string;
  room: RoomSummary;
}

export interface JoinApprovalRequestedPayload {
  roomCode: string;
  requester: {
    userId: string;
    username: string;
  };
  requestedAt: number;
}

export interface JoinRequestRejectedPayload {
  roomCode: string;
  reason: string;
}

export interface PlayerJoinedPayload {
  roomCode: string;
  player: PlayerSummary;
  players: PlayerSummary[];
}

export interface PlayerReadyStatusPayload {
  roomCode: string;
  userId: string;
  isReady: boolean;
  allReady: boolean;
}

export interface CountdownTickPayload {
  roomCode: string;
  secondsRemaining: number;
}

export interface RaceStartedPayload {
  roomCode: string;
  textPrompt: string;
  promptId: string;
  characterCount: number;
  raceStartedAt: number;
}

export interface MultiplayerProgressUpdatePayload {
  roomCode: string;
  players: PlayerSummary[];
}

export interface PlayerFinishedPayload {
  roomCode: string;
  userId: string;
  rank: number;
  wpm: number;
  accuracy: number;
  totalTimeMs: number;
}

export interface RaceSummaryPayload {
  roomCode: string;
  leaderboard: LeaderboardEntry[];
  raceDurationMs: number;
}

export interface PlayerLeftPayload {
  roomCode: string;
  userId: string;
  username: string;
  newHostUserId?: string | undefined;
}

export interface HostChangedPayload {
  roomCode: string;
  newHostUserId: string;
  newHostUsername: string;
}

export interface MultiplayerClientToServerEvents {
  create_room: (payload?: CreateRoomPayload) => void;
  join_room_request: (payload: JoinRoomRequestPayload) => void;
  approve_join_request: (payload: ApproveJoinRequestPayload) => void;
  reject_join_request: (payload: RejectJoinRequestPayload) => void;
  toggle_ready: (payload: ToggleReadyPayload) => void;
  start_race_countdown: (payload: StartRaceCountdownPayload) => void;
  multiplayer_typing_progress: (payload: MultiplayerTypingProgressPayload) => void;
  leave_room: (payload: LeaveRoomPayload) => void;
}

export interface MultiplayerServerToClientEvents {
  room_created: (payload: RoomCreatedPayload) => void;
  join_approval_requested: (payload: JoinApprovalRequestedPayload) => void;
  join_request_rejected: (payload: JoinRequestRejectedPayload) => void;
  player_joined: (payload: PlayerJoinedPayload) => void;
  player_ready_status: (payload: PlayerReadyStatusPayload) => void;
  countdown_tick: (payload: CountdownTickPayload) => void;
  race_started: (payload: RaceStartedPayload) => void;
  multiplayer_progress_update: (payload: MultiplayerProgressUpdatePayload) => void;
  player_finished: (payload: PlayerFinishedPayload) => void;
  race_summary: (payload: RaceSummaryPayload) => void;
  player_left: (payload: PlayerLeftPayload) => void;
  host_changed: (payload: HostChangedPayload) => void;
}
