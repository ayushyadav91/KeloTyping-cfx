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
