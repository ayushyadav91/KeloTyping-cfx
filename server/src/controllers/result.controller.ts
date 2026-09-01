import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Result from '../models/result.model';
import User from '../models/user.model';
import asyncHandler from '../utils/asyncHandler';

// @desc    Save a solo typing test result
// @route   POST /api/results
export const createResult = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
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
    userId: user._id,
    wpm,
    accuracy,
    errors: errorCount || 0,
    totalTyped,
    duration: duration || 30,
  });

  if (wpm > user.bestWpm) {
    await User.findByIdAndUpdate(user._id, { bestWpm: wpm });
  }

  res.status(201).json({ success: true, result });
});

// @desc    Get the logged-in user's result history
// @route   GET /api/results/me
export const getMyResults = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const results = await Result.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50);
  res.status(200).json({ success: true, count: results.length, results });
});

// @desc    Public leaderboard (solo best scores)
// @route   GET /api/results/leaderboard
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(String(req.query.limit), 10) || 10, 100);

  const results = await Result.find().sort({ wpm: -1 }).limit(limit).populate('userId', 'username');

  const leaderboard = results.map((r) => {
    const populatedUser = r.userId as unknown as { username?: string } | null;
    return {
      username: populatedUser?.username || 'Unknown',
      wpm: r.wpm,
      accuracy: r.accuracy,
      date: r.createdAt,
    };
  });

  res.status(200).json({ success: true, count: leaderboard.length, leaderboard });
});
