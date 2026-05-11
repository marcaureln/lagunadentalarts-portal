import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse);

  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      practiceId: true,
      passwordHash: true,
      passwordExpiresAt: true,
    },
  });

  if (!dbUser?.passwordHash) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    });
  }

  const ok = await verifyPassword(dbUser.passwordHash, password);
  if (!ok) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    });
  }

  await setUserSession(event, {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
      role: dbUser.role,
      practiceId: dbUser.practiceId,
      passwordExpiresAt: dbUser.passwordExpiresAt ? dbUser.passwordExpiresAt.toISOString() : null,
    },
  });

  const isExpired = dbUser.passwordExpiresAt ? dbUser.passwordExpiresAt.getTime() <= Date.now() : false;

  return {
    success: true,
    redirectTo: isExpired ? '/password' : '/',
  };
});
