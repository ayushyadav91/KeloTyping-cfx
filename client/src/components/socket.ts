import { io, Socket } from 'socket.io-client';

const SOCKET_URL = '/';

export let socket: Socket | null = null;

export const initSocket = (token?: string) => {
  const authToken = token || localStorage.getItem('token') || undefined;
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
      auth: { token: authToken },
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const reconnectSocket = (token?: string) => {
  disconnectSocket();
  return initSocket(token);
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const socketEvents = {
  // Solo Room Emit Events
  emitStartSoloSession: (options?: any) => getSocket().emit('start_solo_session', options || {}),
  emitTypingProgress: (progress: { sessionId: string; typedIndex: number; correctCharacters: number }) =>
    getSocket().emit('typing_progress', progress),
  
  // Multiplayer Room Emit Events
  emitCreateRoom: (options?: { maxPlayers?: number }) => getSocket().emit('create_room', options || {}),
  emitJoinRoom: (code: string) => getSocket().emit('join_room', { code }),
  emitLeaveRoom: () => getSocket().emit('leave_room'),
  emitToggleReady: () => getSocket().emit('toggle_ready'),
  emitRaceProgress: (progress: { typedIndex: number; correctCharacters: number }) =>
    getSocket().emit('race_progress', progress),

  // Shared Listens
  onError: (cb: (error: any) => void) => getSocket().on('error_event', cb),
  offError: (cb: (error: any) => void) => getSocket().off('error_event', cb),
  
  // Solo Room Listens
  onSessionStarted: (cb: (data: any) => void) => getSocket().on('session_started', cb),
  offSessionStarted: (cb: (data: any) => void) => getSocket().off('session_started', cb),
  onStatsUpdate: (cb: (stats: any) => void) => getSocket().on('stats_update', cb),
  offStatsUpdate: (cb: (stats: any) => void) => getSocket().off('stats_update', cb),
  onSessionSummary: (cb: (summary: any) => void) => getSocket().on('session_summary', cb),
  offSessionSummary: (cb: (summary: any) => void) => getSocket().off('session_summary', cb),

  // Multiplayer Room Listens
  onRoomState: (cb: (state: any) => void) => getSocket().on('room_state', cb),
  offRoomState: (cb: (state: any) => void) => getSocket().off('room_state', cb),
  onRoomCountdown: (cb: (data: any) => void) => getSocket().on('room_countdown', cb),
  offRoomCountdown: (cb: (data: any) => void) => getSocket().off('room_countdown', cb),
  onRaceStarted: (cb: (data: any) => void) => getSocket().on('race_started', cb),
  offRaceStarted: (cb: (data: any) => void) => getSocket().off('race_started', cb),
  onRaceProgressUpdate: (cb: (progress: any) => void) => getSocket().on('race_progress_update', cb),
  offRaceProgressUpdate: (cb: (progress: any) => void) => getSocket().off('race_progress_update', cb),
  onPlayerFinished: (cb: (data: any) => void) => getSocket().on('player_finished', cb),
  offPlayerFinished: (cb: (data: any) => void) => getSocket().off('player_finished', cb),
  onRaceSummary: (cb: (summary: any) => void) => getSocket().on('race_summary', cb),
  offRaceSummary: (cb: (summary: any) => void) => getSocket().off('race_summary', cb),
};
