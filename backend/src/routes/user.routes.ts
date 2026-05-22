import { Role } from '@prisma/client';
import { Router } from 'express';
import { indexUsers, patchUser, storeUser } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware([Role.TECHNICIAN]));

router.get('/', indexUsers);
router.post('/', storeUser);
router.patch('/:id', patchUser);

export default router;
