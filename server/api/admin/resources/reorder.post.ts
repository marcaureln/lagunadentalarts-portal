import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';

const schema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  if (!permissions.canManageResources(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  const { orderedIds } = await readValidatedBody(event, schema.parse);

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.resource.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  return { success: true };
});
