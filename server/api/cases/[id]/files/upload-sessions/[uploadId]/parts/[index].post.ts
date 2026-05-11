import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';
import { requireRouteParam } from '~~/server/utils/routeParams';
import { getStorage } from '~~/server/utils/storage';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const caseId = requireRouteParam(event, 'id', 'Case ID');
  const uploadId = requireRouteParam(event, 'uploadId', 'Upload session ID');
  const indexParam = requireRouteParam(event, 'index', 'Part index');
  const partNumber = Number.parseInt(indexParam, 10);
  if (!Number.isFinite(partNumber) || partNumber < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid part number' });
  }

  const session = await prisma.uploadSession.findUnique({
    where: { id: uploadId },
    include: { case: { select: { practiceId: true, status: true } } },
  });
  if (!session || session.caseId !== caseId) {
    throw createError({ statusCode: 404, statusMessage: 'Upload session not found' });
  }
  if (session.status !== 'PENDING') {
    throw createError({ statusCode: 409, statusMessage: `Upload session is ${session.status.toLowerCase()}` });
  }
  if (partNumber > session.totalChunks) {
    throw createError({ statusCode: 400, statusMessage: 'Part number exceeds totalChunks' });
  }

  if (
    !permissions.canEditCase({
      role: user.role,
      userPracticeId: user.practiceId,
      casePracticeId: session.case.practiceId,
      caseStatus: session.case.status,
    })
  ) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have permission to upload to this case' });
  }

  const contentLengthHeader = getHeader(event, 'content-length');
  const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : 0;
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    throw createError({ statusCode: 411, statusMessage: 'Content-Length is required' });
  }

  const storage = getStorage();
  const result = await storage.proxyUploadChunk({
    externalUploadId: session.externalUploadId,
    partNumber,
    totalChunks: session.totalChunks,
    chunkSize: session.chunkSize,
    body: event.node.req,
    contentLength,
  });

  return { etag: result.etag };
});
