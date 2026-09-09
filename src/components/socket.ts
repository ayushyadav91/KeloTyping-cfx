import { io, Socket } from 'socket.io-client';

const SOCKET_URL = '/';

export let socket: Socket | null = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const socketEvents = {
  // Solo Room Emit Events
  emitStartSoloSession: (options: any) => socket?.emit('start_solo_session', options),
  emitTypingProgress: (progress: any) => socket?.emit('typing_progress', progress),
  
  // Multiplayer Room Emit Events
  emitCreateRoom: (options: any) => socket?.emit('create_room', options),
  emitJoinRoom: (roomId: string) => socket?.emit('join_room', roomId),
  emitLeaveRoom: (roomId: string) => socket?.emit('leave_room', roomId),
  emitToggleReady: (roomId: string) => socket?.emit('toggle_ready', roomId),
  emitRaceProgress: (roomId: string, progress: any) => socket?.emit('race_progress', { roomId, ...progress }),

  // Shared Listens
  onError: (cb: (error: any) => void) => socket?.on('error_event', cb),
  offError: (cb: (error: any) => void) => socket?.off('error_event', cb),
  
  // Solo Room Listens
  onSessionStarted: (cb: (data: any) => void) => socket?.on('session_started', cb),
  offSessionStarted: (cb: (data: any) => void) => socket?.off('session_started', cb),
  onStatsUpdate: (cb: (stats: any) => void) => socket?.on('stats_update', cb),
  offStatsUpdate: (cb: (stats: any) => void) => socket?.off('stats_update', cb),
  onSessionSummary: (cb: (summary: any) => void) => socket?.on('session_summary', cb),
  offSessionSummary: (cb: (summary: any) => void) => socket?.off('session_summary', cb),

  // Multiplayer Room Listens
  onRoomState: (cb: (state: any) => void) => socket?.on('room_state', cb),
  offRoomState: (cb: (state: any) => void) => socket?.off('room_state', cb),
  onRoomCountdown: (cb: (data: any) => void) => socket?.on('room_countdown', cb),
  offRoomCountdown: (cb: (data: any) => void) => socket?.off('room_countdown', cb),
  onRaceStarted: (cb: (data: any) => void) => socket?.on('race_started', cb),
  offRaceStarted: (cb: (data: any) => void) => socket?.off('race_started', cb),
  onRaceProgressUpdate: (cb: (progress: any) => void) => socket?.on('race_progress_update', cb),
  offRaceProgressUpdate: (cb: (progress: any) => void) => socket?.off('race_progress_update', cb),
  onPlayerFinished: (cb: (data: any) => void) => socket?.on('player_finished', cb),
  offPlayerFinished: (cb: (data: any) => void) => socket?.off('player_finished', cb),
  onRaceSummary: (cb: (summary: any) => void) => socket?.on('race_summary', cb),
  offRaceSummary: (cb: (summary: any) => void) => socket?.off('race_summary', cb),
};
