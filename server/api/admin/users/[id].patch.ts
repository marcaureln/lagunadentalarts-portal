import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { z } from 'zod';
import { requireAdmin } from '~~/server/utils/admin';

const bodySchema = z.object({
  role: z.enum(['PRACTICESTAFF', 'ADMIN']),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, 'id');
  const { role } = await readValidatedBody(event, bodySchema.parse);

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });
    return updatedUser;
  } catch (e: unknown) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      });
    }
    throw e;
  }
});
