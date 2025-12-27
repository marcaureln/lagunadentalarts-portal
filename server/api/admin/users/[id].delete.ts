import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { requireAdmin } from '../../../utils/admin';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, 'id');

  try {
    await prisma.user.delete({
      where: { id },
    });
    return { success: true };
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
