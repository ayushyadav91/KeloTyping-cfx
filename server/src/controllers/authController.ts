import { Request, Response } from "express";
import { validationResult } from "express-validator";
import User from "../models/User";
import generateToken from "../utils/generateToken";
import asyncHandler from "../utils/asyncHandler";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, email, password } = req.body as {
    username: string;
    email: string;
    password: string;
  };

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "A user with that email or username already exists",
    });
  }

  const user = await User.create({ username, email, password });

  const token = generateToken(user._id as import("mongoose").Types.ObjectId);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      bestWpm: user.bestWpm,
    },
  });
});

// @desc    Login a user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const token = generateToken(user._id as import("mongoose").Types.ObjectId);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      bestWpm: user.bestWpm,
    },
  });
});

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      bestWpm: user.bestWpm,
      createdAt: user.createdAt,
    },
  });
});
