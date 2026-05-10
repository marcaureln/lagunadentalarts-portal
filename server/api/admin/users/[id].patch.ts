import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { z } from 'zod';
import { requireAdmin } from '~~/server/utils/admin';
import { prisma } from '~~/server/utils/prisma';

const bodySchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.email().optional(),
    role: z.enum(['ADMIN', 'USER']).optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined || data.role !== undefined, {
    message: 'At least one field must be provided',
  });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, 'id');
  const body = await readValidatedBody(event, bodySchema.parse);

  try {
    const existing = await prisma.user.findUniqueOrThrow({
      where: { id },
      select: { role: true },
    });

    if (body.role && ['PRACTICE_STAFF', 'PRACTICE_ADMIN'].includes(existing.role)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Use the practice staff endpoint to manage practice users',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.role !== undefined && { role: body.role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        pfp: true,
        role: true,
        practiceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updatedUser;
  } catch (e: unknown) {
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === 'P2025') {
        throw createError({ statusCode: 404, statusMessage: 'User not found' });
      }
      if (e.code === 'P2002') {
        throw createError({ statusCode: 409, statusMessage: 'Email already in use' });
      }
    }
    throw e;
  }
});
