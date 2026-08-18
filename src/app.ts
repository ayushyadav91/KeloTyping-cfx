import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.route";
import resultRoutes from "./routes/result.route";
import { errorHandler, notFound } from "./middleware/errorHandler.middleware";
import { env } from "./config/env.config";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});
app.use("/api/auth", authLimiter);

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/results", resultRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
