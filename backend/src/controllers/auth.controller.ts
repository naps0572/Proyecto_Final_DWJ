import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { loginUser, registerUser } from '../services/auth.service';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await registerUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await loginUser(req.body);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    return res.json(user);
  } catch (error) {
    next(error);
  }
}
