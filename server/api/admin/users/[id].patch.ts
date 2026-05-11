import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { requireAdmin } from '~~/server/utils/admin';
import { prisma } from '~~/server/utils/prisma';
import { requireUserId } from '~~/server/utils/routeParams';
import { buildUserUpdateData } from '~~/server/utils/userUpdate';
import { ldaRoleSchema, updateUserBody } from '~~/shared/schemas/user';

const bodySchema = updateUserBody(ldaRoleSchema);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = requireUserId(event);
  const body = await readValidatedBody(event, bodySchema.parse);

  try {
    const existing = await prisma.user.findUniqueOrThrow({
      where: { id },
      select: { role: true },
    });

    if (body.role && ['PRACTICE_STAFF', 'PRACTICE_ADMIN'].includes(existing.role)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Use the practice staff endpoint to manage practice users',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: buildUserUpdateData(body),
      select: {
        id: true,
        name: true,
        email: true,
        pfp: true,
        role: true,
        practiceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updatedUser;
  } catch (e: unknown) {
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === 'P2025') {
        throw createError({ statusCode: 404, statusMessage: 'User not found' });
      }
      if (e.code === 'P2002') {
        throw createError({ statusCode: 409, statusMessage: 'Email already in use' });
      }
    }
    throw e;
  }
});
