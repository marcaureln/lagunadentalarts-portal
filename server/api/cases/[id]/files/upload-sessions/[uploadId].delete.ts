import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';
import { requireRouteParam } from '~~/server/utils/routeParams';
import { getStorage } from '~~/server/utils/storage';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const caseId = requireRouteParam(event, 'id', 'Case ID');
  const uploadId = requireRouteParam(event, 'uploadId', 'Upload session ID');

  const session = await prisma.uploadSession.findUnique({
    where: { id: uploadId },
    include: { case: { select: { practiceId: true, status: true } } },
  });
  if (!session || session.caseId !== caseId) {
    throw createError({ statusCode: 404, statusMessage: 'Upload session not found' });
  }

  if (
    !permissions.canEditCase({
      role: user.role,
      userPracticeId: user.practiceId,
      casePracticeId: session.case.practiceId,
      caseStatus: session.case.status,
    })
  ) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have permission to abort this upload' });
  }

  if (session.status === 'PENDING') {
    const storage = getStorage();
    try {
      await storage.abortChunkedUpload({
        caseId,
        slotId: session.slotId,
        fileName: session.fileName,
        externalUploadId: session.externalUploadId,
      });
    } catch {
      // Even if the backend cleanup fails (e.g. S3 returns NoSuchUpload), we still mark the
      // session ABORTED so the client can move on; orphan parts are reclaimable later.
    }
    await prisma.uploadSession.update({
      where: { id: session.id },
      data: { status: 'ABORTED' },
    });
  }

  setResponseStatus(event, 204);
  return null;
});
