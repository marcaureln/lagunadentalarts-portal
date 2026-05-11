import { prisma } from '~~/server/utils/prisma';
import { requireAdmin } from '~~/server/utils/admin';
import { getStorage } from '~~/server/utils/storage';
import { logger } from '~~/server/utils/logger';
import { requireResourceId } from '~~/server/utils/routeParams';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = requireResourceId(event);

  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) {
    throw createError({ statusCode: 404, statusMessage: 'Resource not found' });
  }

  await prisma.resource.delete({ where: { id } });

  // Storage cleanup is best-effort: an orphan blob is preferable to a dangling DB row.
  await getStorage()
    .deleteResource(resource.storageKey)
    .catch((e) => logger.error('Failed to delete resource blob', { storageKey: resource.storageKey, error: e }));

  return { success: true };
});
