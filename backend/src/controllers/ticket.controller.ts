import { NextFunction, Request, Response } from 'express';
import {
  addComment,
  createTicket,
  getTicketById,
  getTickets,
  updateTicket
} from '../services/ticket.service';

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

export async function listTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const tickets = await getTickets(user.id, user.role);
    return res.json(tickets);
  } catch (error) {
    next(error);
  }
}

export async function showTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const ticketId = parseRouteId(req.params.id);
    const ticket = await getTicketById(ticketId, user.id, user.role);
    return res.json(ticket);
  } catch (error) {
    next(error);
  }
}

export async function storeTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const ticket = await createTicket(req.body, user.id);
    return res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
}

export async function editTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const ticketId = parseRouteId(req.params.id);
    const ticket = await updateTicket(ticketId, req.body, user.role, user.id);
    return res.json(ticket);
  } catch (error) {
    next(error);
  }
}

export async function storeComment(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const ticketId = parseRouteId(req.params.id);
    const comment = await addComment(ticketId, req.body, user.id, user.role);
    return res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
}
