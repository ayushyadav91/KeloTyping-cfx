import mongoose from 'mongoose';
import { env } from './env.config';
import { logger } from '../utils/logger';

mongoose.set('strictQuery', true);

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    logger.info('MongoDB connected', { host: conn.connection.host, db: conn.connection.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('MongoDB connection error', { message });
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
};
