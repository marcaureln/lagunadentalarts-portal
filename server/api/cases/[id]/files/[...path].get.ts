import { prisma } from '~~/server/utils/prisma';
import { getStorage } from '~~/server/utils/storage';
import { permissions } from '~~/shared/utils/permissions';

interface CaseFile {
  slotId: string;
  fileName: string;
  fileSize?: number;
  uploadedAt?: string;
  path?: string;
}

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const caseId = getRouterParam(event, 'id');
  if (!caseId) {
    throw createError({ statusCode: 400, statusMessage: 'Case ID is required' });
  }

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

  if (!permissions.canViewCase(user.role, user.practiceId, existingCase.practiceId)) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient permissions' });
  }

  const files = (existingCase.files as unknown as CaseFile[] | null) ?? [];
  const known = files.some((f) => {
    const knownPath = f.path ?? `${f.slotId}/${f.fileName}`;
    return knownPath === filePath;
  });
  if (!known) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' });
  }

  const storage = getStorage();
  const { stream, contentType, contentLength, fileName } = await storage.downloadFile(caseId, filePath);

  setResponseHeader(event, 'content-type', contentType);
  setResponseHeader(event, 'content-length', contentLength);
  setResponseHeader(event, 'content-disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

  return sendStream(event, stream);
});
