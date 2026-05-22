import { NextFunction, Request, Response } from 'express';
import { createManagedUser, listUsers, updateManagedUser } from '../services/user.service';

function parseRouteId(value: unknown) {
  if (typeof value !== 'string') {
    throw new Error('Parámetro id inválido');
  }

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Parámetro id inválido');
  }
  return id;
}

export async function indexUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await listUsers();
    return res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function storeUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await createManagedUser(req.body);
    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export async function patchUser(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = req.user!;
    const userId = parseRouteId(req.params.id);
    const user = await updateManagedUser(userId, req.body, actor.id);
    return res.json(user);
  } catch (error) {
    next(error);
  }
}
