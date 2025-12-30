import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const { currentPassword, newPassword } = await readValidatedBody(event, bodySchema.parse);

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!dbUser?.passwordHash) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password not set for this account',
    });
  }

  const ok = await verifyPassword(dbUser.passwordHash, currentPassword);
  if (!ok) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    });
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      passwordHash: await hashPassword(newPassword),
      passwordExpiresAt: null,
    } as unknown as Parameters<typeof prisma.user.update>[0]['data'],
  });

  await setUserSession(event, {
    user: {
      ...session.user,
      passwordExpiresAt: null,
    },
  });

  return { success: true };
});
