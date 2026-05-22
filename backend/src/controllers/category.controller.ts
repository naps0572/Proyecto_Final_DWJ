import { NextFunction, Request, Response } from 'express';
import { createCategory, getCategories } from '../services/category.service';

export async function listCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await getCategories();
    return res.json(categories);
  } catch (error) {
    next(error);
  }
}

export async function storeCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await createCategory(req.body);
    return res.status(201).json(category);
  } catch (error) {
    next(error);
  }
}
