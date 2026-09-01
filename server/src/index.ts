import http from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { env } from './config/env.config';
import { logger } from './utils/logger';
import { connectDB, disconnectDB } from './config/database.config';
import { socketAuthMiddleware } from './middlewares/authMiddleware';
import { registerTypingSocketHandlers } from './controllers/typing.socket';
import { registerRoomSocketHandlers } from './controllers/room.socket';
import { typingService } from './controllers/typing.service';
import { roomService } from './controllers/room.service';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './models/typing.types';

async function bootstrap(): Promise<void> {
  await connectDB();

  const httpServer = http.createServer(app);

  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      maxHttpBufferSize: 1e6,
      pingTimeout: 20000,
      pingInterval: 25000,
    }
  );

  // Every socket must present a valid JWT (see middlewares/authMiddleware.ts) —
  // there is no dev-mode bypass anymore, solo and multiplayer both require auth.
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    registerTypingSocketHandlers(io, socket);
    registerRoomSocketHandlers(io, socket);
  });

  httpServer.listen(env.PORT, () => {
    logger.info('Kelo Typing Engine server started', {
      environment: env.NODE_ENV,
      port: env.PORT,
      sessionTtlMinutes: env.SESSION_TTL_MINUTES,
      roomMaxPlayers: env.ROOM_MAX_PLAYERS,
    });
  });

  const gracefulShutdown = (signal: string) => {
    logger.warn(`Received ${signal} signal. Initiating graceful shutdown...`);

    typingService.stopCleanupTimer();
    roomService.stopCleanupTimer();

    io.close(() => {
      logger.info('Socket.IO server closed active connections.');
    });

    httpServer.close(() => {
      disconnectDB()
        .catch((err) => logger.error('Error closing MongoDB connection', { error: String(err) }))
        .finally(() => {
          logger.info('HTTP server closed. Exiting process.');
          process.exit(0);
        });
    });

    setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded. Terminating process.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal error during server bootstrap', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
