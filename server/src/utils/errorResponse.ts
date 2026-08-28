export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class SocketError extends AppError {
  public readonly code: string;

  constructor(message: string, code = 'SOCKET_ERROR', statusCode = 400) {
    super(message, statusCode);
    this.code = code;
  }
}

export class ValidationError extends SocketError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class SessionNotFoundError extends SocketError {
  constructor(sessionId: string) {
    super(`Session '${sessionId}' not found or has expired`, 'SESSION_NOT_FOUND', 444);
  }
}

export class AntiCheatError extends SocketError {
  constructor(message = 'Keystroke progress velocity anomaly detected') {
    super(message, 'ANTI_CHEAT_TRIGGERED', 429);
  }
}

export class InvalidInviteTokenError extends SocketError {
  constructor(message = 'The provided invite link token is invalid or has been tampered with') {
    super(message, 'INVALID_INVITE_LINK', 403);
  }
}

export class ExpiredInviteTokenError extends SocketError {
  constructor(message = 'The invite link for this room has expired') {
    super(message, 'EXPIRED_INVITE_LINK', 410);
  }
}

export class RoomNotFoundError extends SocketError {
  constructor(roomCode: string) {
    super(`Room '${roomCode}' does not exist or has been closed`, 'ROOM_NOT_FOUND', 404);
  }
}

export class RoomFullError extends SocketError {
  constructor(roomCode: string) {
    super(`Room '${roomCode}' has reached maximum participant capacity`, 'ROOM_FULL', 409);
  }
}

export class RoomStateError extends SocketError {
  constructor(message: string) {
    super(message, 'INVALID_ROOM_STATE', 400);
  }
}

export class UnauthorizedRoomActionError extends SocketError {
  constructor(message = 'Only the room host can perform this action') {
    super(message, 'UNAUTHORIZED_ROOM_ACTION', 403);
  }
}

