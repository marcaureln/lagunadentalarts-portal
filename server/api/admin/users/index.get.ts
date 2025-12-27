import { requireAdmin } from '../../../utils/admin';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return users;
});
