import http from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { env } from './config/env.config';
import { logger } from './utils/logger';
import { socketAuthMiddleware } from './middlewares/authMiddleware';
import { registerTypingSocketHandlers } from './controllers/typing.socket';
import { registerMultiplayerSocketHandlers } from './controllers/multiplayer.socket';
import { typingService } from './controllers/typing.service';
import { multiplayerService } from './controllers/multiplayer.service';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './models/typing.types';

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

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  registerTypingSocketHandlers(io, socket);
  registerMultiplayerSocketHandlers(io, socket);
});

httpServer.listen(env.PORT, () => {
  logger.info('Kelo Typing Engine server started', {
    environment: env.NODE_ENV,
    port: env.PORT,
    sessionTtlMinutes: env.SESSION_TTL_MINUTES,
  });
});

const gracefulShutdown = (signal: string) => {
  logger.warn(`Received ${signal} signal. Initiating graceful shutdown...`);

  typingService.stopCleanupTimer();
  multiplayerService.stopCleanupTimer();

  io.close(() => {
    logger.info('Socket.IO server closed active connections.');
  });

  httpServer.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });


  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Terminating process.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

