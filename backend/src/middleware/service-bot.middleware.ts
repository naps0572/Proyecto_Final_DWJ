import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';

export function serviceBotMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!env.serviceBotApiKey) {
    return res.status(503).json({ message: 'Integración de bot no configurada' });
  }

  const authHeader = req.header('authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const apiKey = req.header('x-service-bot-key') ?? bearerToken;

  if (apiKey !== env.serviceBotApiKey) {
    return res.status(401).json({ message: 'API key inválida' });
  }

  next();
}
