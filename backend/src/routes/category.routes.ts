import { Role } from '@prisma/client';
import { Router } from 'express';
import { listCategories, storeCategory } from '../controllers/category.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

const router = Router();

router.get('/', authMiddleware, listCategories);
router.post('/', authMiddleware, roleMiddleware([Role.TECHNICIAN]), storeCategory);

export default router;
