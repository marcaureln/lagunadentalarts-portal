import { prisma } from '~~/server/utils/prisma';
import { requireAdmin } from '~~/server/utils/admin';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'USER'] } },
    select: {
      id: true,
      name: true,
      email: true,
      pfp: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return users;
});
