import { prisma } from '~~/server/utils/prisma';
import { requireAdmin } from '~~/server/utils/admin';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      pfp: true,
      role: true,
      practiceId: true,
      createdAt: true,
      updatedAt: true,
      practice: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return users;
});
