import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';
import { getStorage } from '~~/server/utils/storage';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_BYTES = 25 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  if (!permissions.canManageResources(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  const formData = await readMultipartFormData(event);
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' });
  }

  const filePart = formData.find((p) => p.name === 'file' && p.filename && p.data);
  if (!filePart || !filePart.filename || !filePart.data) {
    throw createError({ statusCode: 400, statusMessage: 'A file is required' });
  }

  if (filePart.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'File exceeds 25 MB limit' });
  }

  const mimeType = filePart.type || 'application/octet-stream';
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw createError({ statusCode: 400, statusMessage: `Unsupported file type: ${mimeType}` });
  }

  const titlePart = formData.find((p) => p.name === 'title');
  const title = titlePart?.data?.toString().trim();
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'Title is required' });
  }

  const description =
    formData
      .find((p) => p.name === 'description')
      ?.data?.toString()
      .trim() || null;
  const sortOrderRaw = formData.find((p) => p.name === 'sortOrder')?.data?.toString();
  const sortOrder = sortOrderRaw ? Number.parseInt(sortOrderRaw, 10) : 0;

  const storage = getStorage();
  const uploaded = await storage.uploadResource(filePart.data, filePart.filename, mimeType);

  try {
    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        fileName: filePart.filename,
        storageKey: uploaded.storageKey,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        uploadedById: user.id,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });
    return resource;
  } catch (e) {
    // Best-effort cleanup so we don't leave an orphan blob if the DB insert failed.
    await storage.deleteResource(uploaded.storageKey).catch(() => undefined);
    throw e;
  }
});
