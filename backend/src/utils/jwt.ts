import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '@prisma/client';

export interface TokenPayload {
  id: number;
  email: string;
  role: Role;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '1d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
