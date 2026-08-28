import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.config';
import { promptsRouter } from './routes/prompts.routes';
import { typingService } from './controllers/typing.service';
import { multiplayerService } from './controllers/multiplayer.service';
import { logger } from './utils/logger';

export const app: Express = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

const httpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
});
app.use(httpLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    environment: env.NODE_ENV,
    activeSoloSessions: typingService.getActiveSessionsCount(),
    activeMultiplayerRooms: multiplayerService.getActiveRoomsCount(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/prompts', promptsRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled Express HTTP Error', { message: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

