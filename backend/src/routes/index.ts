import { Router } from 'express';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import ticketRoutes from './ticket.routes';
import userRoutes from './user.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/tickets', ticketRoutes);
router.use('/users', userRoutes);

export default router;
