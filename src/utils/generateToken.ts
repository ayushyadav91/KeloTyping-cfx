import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.config";

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);
};

export default generateToken;
