import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { z } from 'zod';
import { requireAdmin } from '~~/server/utils/admin';

const bodySchema = z.object({
  role: z.enum(['PRACTICE_STAFF', 'PRACTICE_ADMIN', 'ADMIN', 'USER']),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, 'id');
  const { role } = await readValidatedBody(event, bodySchema.parse);

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id },
    });

    // Users cannot transition from practice staff/admin to admin/user
    if (['PRACTICE_STAFF', 'PRACTICE_ADMIN'].includes(user.role) && ['ADMIN', 'USER'].includes(role)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot change role of practice staff or admin',
      });
    }

    // Users cannot transition from admin/user to practice staff/admin
    if (['ADMIN', 'USER'].includes(user.role) && ['PRACTICE_STAFF', 'PRACTICE_ADMIN'].includes(role)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot change role of dental staff to practice',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });
    return updatedUser;
  } catch (e: unknown) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      });
    }
    throw e;
  }
});
