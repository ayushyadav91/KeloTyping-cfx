import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes";
import resultRoutes from "./routes/resultRoutes";
import { errorHandler, notFound } from "./middleware/errorHandler";

const app = express();

// Security headers
app.use(helmet());

// CORS - only allow the configured frontend origin
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parsing
app.use(express.json());

// Request logging (skip in test env)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Basic rate limiting to slow down brute-force attempts on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});
app.use("/api/auth", authLimiter);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/results", resultRoutes);

// 404 + error handler (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
