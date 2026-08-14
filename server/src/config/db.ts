import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not set in the environment");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`MongoDB connection error: ${message}`);
    process.exit(1);
  }
};

export default connectDB;
