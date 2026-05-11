import { prisma } from '~~/server/utils/prisma';
import { LAB_ROLES, permissions } from '~~/shared/utils/permissions';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  if (!permissions.isLabUser(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  const users = await prisma.user.findMany({
    where: {
      practiceId: null,
      role: { in: [...LAB_ROLES] },
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  });

  return users;
});
