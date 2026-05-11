import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';
import { requireRouteParam } from '~~/server/utils/routeParams';
import { getStorage } from '~~/server/utils/storage';
import { caseFilesArraySchema } from '~~/shared/schemas/case';

const bodySchema = z.object({
  parts: z.array(
    z.object({
      partNumber: z.number().int().positive(),
      etag: z.string().nullable().optional(),
    })
  ),
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const caseId = requireRouteParam(event, 'id', 'Case ID');
  const uploadId = requireRouteParam(event, 'uploadId', 'Upload session ID');
  const body = await readValidatedBody(event, bodySchema.parse);

  const session = await prisma.uploadSession.findUnique({
    where: { id: uploadId },
    include: { case: { select: { id: true, practiceId: true, status: true, files: true } } },
  });
  if (!session || session.caseId !== caseId) {
    throw createError({ statusCode: 404, statusMessage: 'Upload session not found' });
  }
  if (session.status !== 'PENDING') {
    throw createError({ statusCode: 409, statusMessage: `Upload session is ${session.status.toLowerCase()}` });
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

  if (body.parts.length !== session.totalChunks) {
    throw createError({
      statusCode: 400,
      statusMessage: `Expected ${session.totalChunks} parts, got ${body.parts.length}`,
    });
  }

  const storage = getStorage();
  const uploaded = await storage.completeChunkedUpload({
    caseId,
    slotId: session.slotId,
    fileName: session.fileName,
    fileSize: session.fileSize,
    mimeType: session.mimeType,
    externalUploadId: session.externalUploadId,
    parts: body.parts.map((p) => ({ partNumber: p.partNumber, etag: p.etag ?? undefined })),
  });

  const currentFiles = caseFilesArraySchema.parse(session.case.files ?? []);
  const existingIndex = currentFiles.findIndex((f) => f.slotId === session.slotId);
  const entry = {
    slotId: session.slotId,
    fileName: uploaded.fileName,
    fileSize: uploaded.fileSize,
    path: uploaded.path,
    uploadedAt: uploaded.uploadedAt,
    mimeType: uploaded.mimeType,
  };
  if (existingIndex >= 0) {
    currentFiles[existingIndex] = entry;
  } else {
    currentFiles.push(entry);
  }

  const [, updatedCase] = await prisma.$transaction([
    prisma.uploadSession.update({
      where: { id: session.id },
      data: { status: 'COMPLETED' },
    }),
    prisma.case.update({
      where: { id: caseId },
      data: { files: currentFiles as unknown as Prisma.InputJsonValue },
      include: {
        practice: { select: { id: true, name: true } },
        caseType: { select: { id: true, key: true, label: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
  ]);

  return { case: updatedCase, file: entry };
});
