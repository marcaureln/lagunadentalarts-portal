import { prisma } from '~~/server/utils/prisma';
import { requireAdmin } from '~~/server/utils/admin';
import { LAB_ROLES } from '~~/shared/utils/permissions';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const users = await prisma.user.findMany({
    where: { role: { in: [...LAB_ROLES] } },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return users;
});
