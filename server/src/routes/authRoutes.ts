import { Router } from "express";
import { body } from "express-validator";
import { register, login, getMe } from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = Router();

router.post(
  "/register",
  [
    body("username", "Username must be 3-20 characters").trim().isLength({ min: 3, max: 20 }),
    body("email", "Please provide a valid email").isEmail().normalizeEmail(),
    body("password", "Password must be at least 6 characters").isLength({ min: 6 }),
  ],
  register
);

router.post(
  "/login",
  [
    body("email", "Please provide a valid email").isEmail().normalizeEmail(),
    body("password", "Password is required").notEmpty(),
  ],
  login
);

router.get("/me", protect, getMe);

export default router;
