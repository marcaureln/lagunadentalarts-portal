import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { prisma } from '~~/server/utils/prisma';
import { generateTemporaryPassword } from '~~/server/utils/password';
import { permissions } from '~~/shared/utils/permissions';

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const practiceId = getRouterParam(event, 'id');
  const userId = getRouterParam(event, 'userId');
  if (!practiceId || !userId) {
    throw createError({ statusCode: 400, statusMessage: 'Practice ID and User ID are required' });
  }

  if (!permissions.canManageStaff(user.role, user.practiceId, practiceId)) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient permissions' });
  }

  if (userId === user.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot reset your own password — use /password to change it instead',
    });
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, practiceId: true } });
  if (!target || target.practiceId !== practiceId) {
    throw createError({ statusCode: 404, statusMessage: 'User not found in this practice' });
  }

  const temporaryPassword = generateTemporaryPassword();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(temporaryPassword),
        passwordExpiresAt: new Date(),
      },
    });
  } catch (e: unknown) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'User not found' });
    }
    throw e;
  }

  return { temporaryPassword };
});
