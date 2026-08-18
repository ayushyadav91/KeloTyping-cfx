import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { env } from "../config/env.config";
import { ErrorResponse } from "../utils/errorResponse";

interface JwtPayload {
  id: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;

    if (!token) throw new ErrorResponse("Not authorized, no token provided", 401);

    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await User.findById(decoded.id);
    if (!user) throw new ErrorResponse("Not authorized, user no longer exists", 401);

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ErrorResponse) {
      next(err);
      return;
    }
    next(new ErrorResponse("Not authorized, token failed or expired", 401));
  }
};
