import { prisma } from '~~/server/utils/prisma';
import { getStorage } from '~~/server/utils/storage';
import { requireResourceId } from '~~/server/utils/routeParams';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const id = requireResourceId(event);

  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) {
    throw createError({ statusCode: 404, statusMessage: 'Resource not found' });
  }

  const { stream, contentType, contentLength } = await getStorage().downloadResource(resource.storageKey);

  setResponseHeader(event, 'content-type', resource.mimeType || contentType);
  setResponseHeader(event, 'content-length', contentLength || resource.fileSize);
  setResponseHeader(event, 'content-disposition', `attachment; filename="${encodeURIComponent(resource.fileName)}"`);

  return sendStream(event, stream);
});
