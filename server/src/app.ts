import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./routes/auth.route";
import resultRoutes from "./routes/result.route";
import { errorHandler, notFound } from "./middleware/errorHandler.middleware";
import { env } from "./config/env.config";
import { swaggerSpec } from "./config/swagger.config";

const app = express();

// helmet's default CSP blocks Swagger UI's inline scripts/styles, so it's
// disabled here. Fine for this API-only backend; re-enable and add a
// route-specific CSP exception if this app ever serves other HTML pages.
app.use(helmet({ contentSecurityPolicy: false }));
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

// Interactive API docs — http://localhost:3000/api/docs
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "KeloTyping API Docs",
  })
);
// Raw OpenAPI JSON, useful for importing into Postman/Insomnia
app.get("/api/docs.json", (req, res) => {
  res.json(swaggerSpec);
});

app.use("/api/auth", authRoutes);
app.use("/api/results", resultRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
