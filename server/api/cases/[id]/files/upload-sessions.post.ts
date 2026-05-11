import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';
import { requireCaseId } from '~~/server/utils/routeParams';
import { getStorage, getStorageBackend } from '~~/server/utils/storage';
import { guessMimeType } from '~~/server/utils/storage/helpers';

const bodySchema = z.object({
  slotId: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  mimeType: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const caseId = requireCaseId(event);
  const body = await readValidatedBody(event, bodySchema.parse);

  const existingCase = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, practiceId: true, status: true },
  });
  if (!existingCase) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' });
  }

  if (
    !permissions.canEditCase({
      role: user.role,
      userPracticeId: user.practiceId,
      casePracticeId: existingCase.practiceId,
      caseStatus: existingCase.status,
    })
  ) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have permission to upload files to this case' });
  }

  const storage = getStorage();
  const backend = getStorageBackend();
  const mimeType = body.mimeType || guessMimeType(body.fileName);

  const init = await storage.initiateChunkedUpload({
    caseId,
    slotId: body.slotId,
    fileName: body.fileName,
    fileSize: body.fileSize,
    mimeType,
  });

  const session = await prisma.uploadSession.create({
    data: {
      caseId,
      slotId: body.slotId,
      fileName: body.fileName,
      fileSize: body.fileSize,
      mimeType,
      chunkSize: init.chunkSize,
      totalChunks: init.totalChunks,
      externalUploadId: init.externalUploadId,
      backend,
      createdById: user.id,
    },
  });

  const parts = init.parts.map((p) =>
    p.url ? p : { ...p, url: `/api/cases/${caseId}/files/upload-sessions/${session.id}/parts/${p.partNumber}` }
  );

  return {
    uploadId: session.id,
    chunkSize: init.chunkSize,
    totalChunks: init.totalChunks,
    maxConcurrency: init.maxConcurrency,
    parts,
  };
});
