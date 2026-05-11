import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { prisma } from '~~/server/utils/prisma';
import { requirePracticeAndUserId } from '~~/server/utils/routeParams';
import { buildUserUpdateData } from '~~/server/utils/userUpdate';
import { permissions } from '~~/shared/utils/permissions';
import { practiceRoleSchema, updateUserBody } from '~~/shared/schemas/user';

const bodySchema = updateUserBody(practiceRoleSchema);

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

  const body = await readValidatedBody(event, bodySchema.parse);

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: buildUserUpdateData(body),
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    return updated;
  } catch (e: unknown) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Email already in use' });
    }
    throw e;
  }
});
