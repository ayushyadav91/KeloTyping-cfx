import mongoose from "mongoose";
import { env } from "./env.config";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`MongoDB connection error: ${message}`);
    process.exit(1);
  }
};
