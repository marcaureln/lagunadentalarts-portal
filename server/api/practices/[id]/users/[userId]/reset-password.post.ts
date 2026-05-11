import { prisma } from '~~/server/utils/prisma';
import { resetUserPassword } from '~~/server/utils/password';
import { requirePracticeAndUserId } from '~~/server/utils/routeParams';
import { permissions } from '~~/shared/utils/permissions';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { practiceId, userId } = requirePracticeAndUserId(event);

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

  const temporaryPassword = await resetUserPassword(userId);
  return { temporaryPassword };
});
