import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';

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
    // Get practice details
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!practice) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Practice not found',
      });
    }

    // Check permissions
    if (
      !permissions.canViewPractices(user.role) &&
      !(permissions.isPracticeUser(user.role) && user.practiceId === practiceId)
    ) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient permissions',
      });
    }

    return practice;
  }

  if (event.node.req.method === 'PUT') {
    // Update practice (ADMIN only)
    if (!permissions.canManagePractices(user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient permissions',
      });
    }

    const body = await readBody(event);
    const { name, address, phone, email } = body;

    const practice = await prisma.practice.update({
      where: { id: practiceId },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
      },
    });

    return practice;
  }

  if (event.node.req.method === 'DELETE') {
    // Delete practice (ADMIN only)
    if (!permissions.canManagePractices(user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient permissions',
      });
    }

    // Check if practice has users
    const userCount = await prisma.user.count({
      where: { practiceId },
    });

    if (userCount > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot delete practice with assigned users',
      });
    }

    await prisma.practice.delete({
      where: { id: practiceId },
    });

    return { success: true };
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});
