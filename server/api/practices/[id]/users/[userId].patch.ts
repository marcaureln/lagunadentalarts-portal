import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';

const bodySchema = z.object({
  role: z.enum(['PRACTICE_STAFF', 'PRACTICE_ADMIN']),
});

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

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, practiceId: true } });
  if (!target || target.practiceId !== practiceId) {
    throw createError({ statusCode: 404, statusMessage: 'User not found in this practice' });
  }

  const { role } = await readValidatedBody(event, bodySchema.parse);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  return updated;
});
