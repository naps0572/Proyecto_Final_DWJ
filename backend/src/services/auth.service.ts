import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { comparePassword, hashPassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
  // El rol NO se acepta desde el cliente: todos los registros son USER
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function registerUser(input: unknown) {
  const data = registerSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error('El correo ya se encuentra registrado');
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await hashPassword(data.password),
      role: Role.USER // Siempre USER; los técnicos se crean desde el seed/admin
    }
  });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  };
}

export async function loginUser(input: unknown) {
  const data = loginSchema.parse(input);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  const isValid = await comparePassword(data.password, user.password);
  if (!isValid) {
    throw new Error('Credenciales inválidas');
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  };
}
