import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.config';

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
};

export default generateToken;
