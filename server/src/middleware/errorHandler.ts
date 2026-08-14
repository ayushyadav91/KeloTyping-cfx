import { NextFunction, Request, Response } from "express";

interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
}

// Centralized error handler. Any next(err) call or thrown error inside an
// async route (wrapped with asyncHandler) ends up here.
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = err.statusCode && err.statusCode !== 200 ? err.statusCode : 500;
  let message = err.message || "Server error";

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field ? field : "Field"} already in use`;
  }

  // Mongoose validation error
  if (err.name === "ValidationError" && err.errors) {
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
