import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { requireAdmin } from '~~/server/utils/admin';
import { requireResourceId } from '~~/server/utils/routeParams';

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = requireResourceId(event);

  const body = await readValidatedBody(event, updateSchema.parse);

  const updated = await prisma.resource.update({
    where: { id },
    data: body,
    include: { uploadedBy: { select: { id: true, name: true } } },
  });

  return updated;
});
