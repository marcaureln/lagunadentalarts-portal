import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { generateTemporaryPassword } from '~~/server/utils/password';
import { requirePracticeId } from '~~/server/utils/routeParams';
import { permissions } from '~~/shared/utils/permissions';
import { practiceRoleSchema } from '~~/shared/schemas/user';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const practiceId = requirePracticeId(event);

  if (event.node.req.method === 'GET') {
    // List users in practice
    if (!permissions.canManageStaff(user.role, user.practiceId, practiceId)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient permissions',
      });
    }

    const users = await prisma.user.findMany({
      where: { practiceId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return users;
  }

  if (event.node.req.method === 'POST') {
    // Add user to practice
    if (!permissions.canManageStaff(user.role, user.practiceId, practiceId)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient permissions',
      });
    }

    const bodySchema = z.object({
      email: z.email(),
      name: z.string().min(1),
      role: practiceRoleSchema,
    });

    const { email, name, role } = await readValidatedBody(event, bodySchema.parse);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User with this email already exists',
      });
    }

    const temporaryPassword = generateTemporaryPassword();

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        practiceId,
        passwordHash: await hashPassword(temporaryPassword),
        passwordExpiresAt: new Date(),
      } as Parameters<typeof prisma.user.create>[0]['data'],
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
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
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});
