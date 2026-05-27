import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

// Mensajes que corresponden a errores de cliente (4xx), no de servidor
const CLIENT_ERROR_MESSAGES = [
  'Ticket no encontrado',
  'No tienes permisos para ver este ticket',
  'No tienes permisos para comentar este ticket',
  'Solo el técnico puede actualizar tickets',
  'La categoría seleccionada no existe',
  'El técnico asignado no existe o no tiene rol técnico',
  'No hay cambios para aplicar',
  'No puedes quitarte tu propio rol técnico',
  'Usuario no encontrado',
  'El correo ya se encuentra registrado',
  'Credenciales inválidas',
  'Parámetro id inválido',
  'API key inválida',
  'Integración de bot no configurada'
];

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Datos inválidos',
      errors: error.errors
    });
  }

  if (error instanceof Error) {
    const message = error.message;

    if (message === 'Ticket no encontrado' || message === 'Usuario no encontrado') {
      return res.status(404).json({ message });
    }

    if (CLIENT_ERROR_MESSAGES.includes(message)) {
      const status = message.includes('permisos') || message.includes('técnico') ? 403 : 400;
      return res.status(status).json({ message });
    }

    // Error interno real — no exponer el mensaje al cliente en producción
    console.error('[ErrorHandler]', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }

  return res.status(500).json({ message: 'Error interno del servidor' });
}
