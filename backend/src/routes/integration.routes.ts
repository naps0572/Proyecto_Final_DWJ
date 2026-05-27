import { Router } from 'express';
import { storeBotTicket } from '../controllers/integration.controller';
import { serviceBotMiddleware } from '../middleware/service-bot.middleware';

const router = Router();

router.use(serviceBotMiddleware);
router.post('/service-desk-bot/tickets', storeBotTicket);

export default router;
