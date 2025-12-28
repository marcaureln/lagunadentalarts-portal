import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/server/utils/permissions';

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event);
  const practiceId = getRouterParam(event, 'id');

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  if (!practiceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Practice ID is required',
    });
  }

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

    const body = await readBody(event);
    const { email, name, role } = body;

    if (!email || !role) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and role are required',
      });
    }

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

    // Validate role
    if (!['PRACTICE_STAFF', 'PRACTICE_ADMIN'].includes(role)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid role for practice user',
      });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        practiceId,
      },
    });

    return newUser;
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});
