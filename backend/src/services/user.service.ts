import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/hash';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role)
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.nativeEnum(Role).optional()
});

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          ticketsCreated: true,
          ticketsAssigned: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createManagedUser(input: unknown) {
  const data = createUserSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error('El correo ya se encuentra registrado');
  }

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await hashPassword(data.password),
      role: data.role
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });
}

export async function updateManagedUser(userId: number, input: unknown, actorId: number) {
  const data = updateUserSchema.parse(input);

  if (!data.name && !data.role) {
    throw new Error('No hay cambios para aplicar');
  }

  if (userId === actorId && data.role && data.role !== Role.TECHNICIAN) {
    throw new Error('No puedes quitarte tu propio rol técnico');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });
}
