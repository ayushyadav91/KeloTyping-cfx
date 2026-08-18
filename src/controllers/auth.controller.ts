import { Request, Response } from "express";
import { validationResult } from "express-validator";
import User from "../models/user.model";
import generateToken from "../utils/generateToken";
import asyncHandler from "../utils/asyncHandler";
import { ErrorResponse } from "../utils/errorResponse";
import { verifyGoogleToken } from "../config/googleAuth.config";

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  const { username, email, password } = req.body as { username: string; email: string; password: string };

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) throw new ErrorResponse("A user with that email or username already exists", 400);

  const user = await User.create({ username, email, password });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, username: user.username, email: user.email, bestWpm: user.bestWpm },
  });
});

// @desc    Login
// @route   POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ErrorResponse("Invalid credentials", 401);
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: { id: user._id, username: user.username, email: user.email, bestWpm: user.bestWpm },
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
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

const generateUniqueUsername = async (base: string): Promise<string> => {
  const clean = base.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 15) || "player";
  let candidate = clean;
  let attempts = 0;

  while (await User.findOne({ username: candidate })) {
    attempts += 1;
    const suffix = Math.random().toString(36).slice(2, 6);
    candidate = `${clean.slice(0, 14)}_${suffix}`;
    if (attempts > 5) break;
  }

  return candidate;
};

// @desc    Sign in/up with a Google ID token
// @route   POST /api/auth/google
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  const { idToken } = req.body as { idToken: string };

  let profile;
  try {
    profile = await verifyGoogleToken(idToken);
  } catch {
    throw new ErrorResponse("Invalid or expired Google token", 401);
  }

  if (!profile.emailVerified) throw new ErrorResponse("Google email is not verified", 401);

  let user = await User.findOne({ googleId: profile.googleId });

  if (!user) {
    user = await User.findOne({ email: profile.email });

    if (user) {
      user.googleId = profile.googleId;
      if (!user.avatar && profile.avatar) user.avatar = profile.avatar;
      await user.save();
    } else {
      const username = await generateUniqueUsername(profile.name);
      user = await User.create({
        username,
        email: profile.email,
        googleId: profile.googleId,
        authProvider: "google",
        avatar: profile.avatar,
      });
    }
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bestWpm: user.bestWpm,
    },
  });
});
