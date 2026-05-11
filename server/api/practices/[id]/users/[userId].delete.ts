import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { prisma } from '~~/server/utils/prisma';
import { requirePracticeAndUserId } from '~~/server/utils/routeParams';
import { permissions } from '~~/shared/utils/permissions';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { practiceId, userId } = requirePracticeAndUserId(event);

  if (!permissions.canManageStaff(user.role, user.practiceId, practiceId)) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient permissions' });
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, practiceId: true } });
  if (!target || target.practiceId !== practiceId) {
    throw createError({ statusCode: 404, statusMessage: 'User not found in this practice' });
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'User not found' });
    }
    throw e;
  }
});
