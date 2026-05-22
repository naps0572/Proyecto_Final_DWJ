import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

export function roleMiddleware(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }

    next();
  };
}
