import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}
