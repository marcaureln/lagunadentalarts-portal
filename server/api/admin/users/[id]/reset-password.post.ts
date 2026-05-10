import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { requireAdmin } from '~~/server/utils/admin';
import { prisma } from '~~/server/utils/prisma';
import { generateTemporaryPassword } from '~~/server/utils/password';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { user: adminUser } = await requireUserSession(event);

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'User ID is required' });
  }

  if (id === adminUser.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot reset your own password — use /password to change it instead',
    });
  }

  const temporaryPassword = generateTemporaryPassword();

  try {
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: await hashPassword(temporaryPassword),
        passwordExpiresAt: new Date(),
      },
    });
  } catch (e: unknown) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'User not found' });
    }
    throw e;
  }

  return { temporaryPassword };
});
