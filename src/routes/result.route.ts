import { Router } from "express";
import { body } from "express-validator";
import { createResult, getMyResults, getLeaderboard } from "../controllers/result.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/leaderboard", getLeaderboard);

router.post(
  "/",
  protect,
  [
    body("wpm", "wpm must be a non-negative number").isFloat({ min: 0 }),
    body("accuracy", "accuracy must be between 0 and 100").isFloat({ min: 0, max: 100 }),
    body("totalTyped", "totalTyped must be a non-negative number").isInt({ min: 0 }),
    body("errors").optional().isInt({ min: 0 }),
    body("duration").optional().isInt({ min: 1 }),
  ],
  createResult
);

router.get("/me", protect, getMyResults);

export default router;
