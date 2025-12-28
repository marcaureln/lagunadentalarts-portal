import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event);

  if (!user || !permissions.canViewPractices(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Insufficient permissions',
    });
  }

  if (event.node.req.method === 'GET') {
    // List all practices
    const practices = await prisma.practice.findMany({
      include: {
        _count: {
          select: { staff: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return practices;
  }

  if (event.node.req.method === 'POST') {
    // Create new practice (ADMIN only)
    if (!permissions.canManagePractices(user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient permissions',
      });
    }

    const body = await readBody(event);
    const { name, address, phone, email } = body;

    if (!name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name is required',
      });
    }

    const practice = await prisma.practice.create({
      data: {
        name,
        address,
        phone,
        email,
      },
    });

    return practice;
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});
