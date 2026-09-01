import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.config';
import { promptsRouter } from './routes/prompts.routes';
import authRoutes from './routes/auth.route';
import resultRoutes from './routes/result.route';
import { typingService } from './controllers/typing.service';
import { roomService } from './controllers/room.service';
import { errorHandler, notFound } from './middlewares/errorHandler.middleware';
import { openApiSpec } from './docs/openapi';
import { logger } from './utils/logger';

export const app: Express = express();

// helmet's default CSP blocks the inline scripts/styles Swagger UI's HTML needs,
// so it's relaxed only for the /api-docs path below — everywhere else keeps the default.
app.use((req, res, next) => {
  if (req.path.startsWith('/api-docs')) {
    helmet({ contentSecurityPolicy: false })(req, res, next);
  } else {
    helmet()(req, res, next);
  }
});
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/auth', authLimiter);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    environment: env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    activeSoloSessions: typingService.getActiveSessionsCount(),
    activeRooms: roomService.getActiveRoomsCount(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/prompts', promptsRouter);
app.use('/api/auth', authRoutes);
app.use('/api/results', resultRoutes);

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'KeloTyping API Docs',
  })
);
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

app.use(notFound);
app.use(errorHandler);
