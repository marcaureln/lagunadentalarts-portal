import { prisma } from '~~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const resources = await prisma.resource.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      uploadedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return resources;
});
