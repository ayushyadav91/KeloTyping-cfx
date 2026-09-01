import winston from 'winston';
import { env } from '../config/env.config';

const { combine, timestamp, printf, colorize, json } = winston.format;

const devConsoleFormat = printf(({ level, message, timestamp: timeStr, ...metadata }) => {
  const metaString = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
  return `[${timeStr}] ${level}: ${message} ${metaString}`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    env.NODE_ENV === 'production' ? json() : combine(colorize(), devConsoleFormat)
  ),
  transports: [new winston.transports.Console()],
});

