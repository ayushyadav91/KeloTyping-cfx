import jwt, { SignOptions } from "jsonwebtoken";
import { Types } from "mongoose";

const generateToken = (userId: Types.ObjectId | string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in the environment");
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign({ id: userId.toString() }, secret, {
    expiresIn,
  } as SignOptions);
};

export default generateToken;
