import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { requireAdmin } from '~~/server/utils/admin';
import { generateTemporaryPassword } from '~~/server/utils/password';
import { ldaRoleSchema } from '~~/shared/schemas/user';

const bodySchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  role: ldaRoleSchema,
  useSso: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  try {
    const { email, name, role, useSso } = await readValidatedBody(event, bodySchema.parse);

    const resolvedUseSso = typeof useSso === 'boolean' ? useSso : true;
    const shouldCreatePassword = !resolvedUseSso;
    const temporaryPassword = shouldCreatePassword ? generateTemporaryPassword() : null;

    const data: Record<string, unknown> = {
      email,
      name,
      role,
    };

    if (shouldCreatePassword) {
      data.passwordHash = await hashPassword(temporaryPassword as string);
      data.passwordExpiresAt = new Date();
    }

    const newUser = await prisma.user.create({
      data: data as Parameters<typeof prisma.user.create>[0]['data'],
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

    return {
      user: newUser,
      temporaryPassword,
    };
  } catch (e: unknown) {
    if (e instanceof Error && 'code' in e && (e as { code?: string }).code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'User already exists',
      });
    }
    throw e;
  }
});
