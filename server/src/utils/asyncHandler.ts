import { NextFunction, Request, RequestHandler, Response } from "express";

// Wraps an async route handler so any rejected promise / thrown error
// is forwarded to Express's error-handling middleware instead of crashing.
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
