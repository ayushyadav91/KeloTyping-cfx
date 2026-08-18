import { NextFunction, Request, Response } from "express";
import { ErrorResponse } from "../utils/errorResponse";

interface MongooseLikeError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
}

export const errorHandler = (
  err: MongooseLikeError | ErrorResponse,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = "statusCode" in err && err.statusCode ? err.statusCode : 500;
  let message = err.message || "Server error";

  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found";
  }

  if ("code" in err && err.code === 11000) {
    statusCode = 400;
    const field = Object.keys((err as MongooseLikeError).keyValue || {})[0];
    message = `${field ? field : "Field"} already in use`;
  }

  if (err.name === "ValidationError" && "errors" in err && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};
