import { NextFunction, Request, Response } from 'express';
import { createTicketFromBot } from '../services/ticket.service';

export async function storeBotTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await createTicketFromBot(req.body);
    return res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
}
