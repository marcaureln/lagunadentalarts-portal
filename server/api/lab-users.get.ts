import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  if (!permissions.isLDAUser(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  const users = await prisma.user.findMany({
    where: {
      practiceId: null,
      role: { in: ['USER', 'ADMIN'] },
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  });

  return users;
});
