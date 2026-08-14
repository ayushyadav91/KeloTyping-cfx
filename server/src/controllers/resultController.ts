import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Result from "../models/Result";
import User from "../models/User";
import asyncHandler from "../utils/asyncHandler";

// @desc    Save a typing test result for the logged-in user
// @route   POST /api/results
// @access  Private
export const createResult = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const user = req.user!;
  const { wpm, accuracy, errors: errorCount, totalTyped, duration } = req.body as {
    wpm: number;
    accuracy: number;
    errors?: number;
    totalTyped: number;
    duration?: number;
  };

  const result = await Result.create({
    user: user._id,
    wpm,
    accuracy,
    errors: errorCount || 0,
    totalTyped,
    duration: duration || 30,
  });

  // Update the user's personal best
  if (wpm > user.bestWpm) {
    await User.findByIdAndUpdate(user._id, { bestWpm: wpm });
  }

  res.status(201).json({ success: true, result });
});

// @desc    Get the logged-in user's own result history
// @route   GET /api/results/me
// @access  Private
export const getMyResults = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const results = await Result.find({ user: user._id }).sort({ createdAt: -1 }).limit(50);

  res.status(200).json({ success: true, count: results.length, results });
});

// @desc    Get the global leaderboard (top scores across all users)
// @route   GET /api/results/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(String(req.query.limit), 10) || 10, 100);

  const results = await Result.find()
    .sort({ wpm: -1 })
    .limit(limit)
    .populate("user", "username");

  const leaderboard = results.map((r) => {
    const populatedUser = r.user as unknown as { username?: string } | null;
    return {
      username: populatedUser?.username || "Unknown",
      wpm: r.wpm,
      accuracy: r.accuracy,
      date: r.createdAt,
    };
  });

  res.status(200).json({ success: true, count: leaderboard.length, leaderboard });
});
