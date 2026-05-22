import { Router } from 'express';
import {
  editTicket,
  listTickets,
  showTicket,
  storeComment,
  storeTicket
} from '../controllers/ticket.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.get('/', listTickets);
router.get('/:id', showTicket);
router.post('/', storeTicket);
router.patch('/:id', editTicket);
router.post('/:id/comments', storeComment);

export default router;
