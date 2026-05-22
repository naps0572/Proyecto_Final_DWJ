import { z } from 'zod';
import { prisma } from '../config/prisma';

const createCategorySchema = z.object({
  name: z.string().min(2)
});

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function createCategory(input: unknown) {
  const data = createCategorySchema.parse(input);

  return prisma.category.create({
    data: {
      name: data.name
    }
  });
}
