import { prisma } from '~~/server/utils/prisma';
import { getStorage } from '~~/server/utils/storage';
import { requireCaseId } from '~~/server/utils/routeParams';
import { permissions } from '~~/shared/utils/permissions';
import { caseFilesArraySchema } from '~~/shared/schemas/case';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const caseId = requireCaseId(event);

  const pathParam = getRouterParam(event, 'path');
  const filePath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
  if (!filePath) {
    throw createError({ statusCode: 400, statusMessage: 'File path is required' });
  }

  const existingCase = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, practiceId: true, files: true },
  });

  if (!existingCase) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' });
  }

  if (
    !permissions.canViewCase({
      role: user.role,
      userPracticeId: user.practiceId,
      casePracticeId: existingCase.practiceId,
    })
  ) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient permissions' });
  }

  const files = caseFilesArraySchema.parse(existingCase.files ?? []);
  const known = files.some((f) => {
    const knownPath = f.path ?? `${f.slotId}/${f.fileName}`;
    return knownPath === filePath;
  });
  if (!known) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' });
  }

  const isDownload = getQuery(event).download === '1';

  const storage = getStorage();
  const { stream, contentType, contentLength, fileName } = await storage.downloadFile(caseId, filePath);

  if (isDownload && permissions.isLabUser(user.role)) {
    await prisma.caseEvent.create({
      data: {
        caseId,
        type: 'FILE_DOWNLOADED',
        message: fileName,
        createdById: user.id,
      },
    });
  }

  setResponseHeader(event, 'content-type', contentType);
  setResponseHeader(event, 'content-length', contentLength);
  setResponseHeader(
    event,
    'content-disposition',
    `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(fileName)}"`
  );

  return sendStream(event, stream);
});
