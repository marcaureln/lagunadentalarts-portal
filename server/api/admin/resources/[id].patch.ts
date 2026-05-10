import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { requireAdmin } from '~~/server/utils/admin';

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Resource ID is required' });
  }

  const body = await readValidatedBody(event, updateSchema.parse);

  const updated = await prisma.resource.update({
    where: { id },
    data: body,
    include: { uploadedBy: { select: { id: true, name: true } } },
  });

  return updated;
});
