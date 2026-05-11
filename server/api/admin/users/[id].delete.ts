import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { prisma } from '~~/server/utils/prisma';
import { requireAdmin } from '~~/server/utils/admin';
import { requireUserId } from '~~/server/utils/routeParams';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = requireUserId(event);

  try {
    await prisma.user.delete({ where: { id } });
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'User not found' });
    }
    throw e;
  }
});
