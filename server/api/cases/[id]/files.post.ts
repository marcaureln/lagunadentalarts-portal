import { permissions } from '~~/shared/utils/permissions';
import { getStorage } from '~~/server/utils/storage';
import { requireCaseId } from '~~/server/utils/routeParams';
import { caseFilesArraySchema } from '~~/shared/schemas/case';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const caseId = requireCaseId(event);

  // Get the case to verify permissions
  const existingCase = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      practice: { select: { id: true, name: true } },
    },
  });

  if (!existingCase) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' });
  }

  // Check edit permission
  if (!permissions.canEditCase(user.role, user.practiceId, existingCase.practiceId, existingCase.status)) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have permission to upload files to this case' });
  }

  // Parse multipart form data
  const formData = await readMultipartFormData(event);

  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' });
  }

  const storage = getStorage();
  const uploadedFiles = [];

  // Ensure case folder exists
  await storage.createCaseFolder(caseId, existingCase.practiceId);

  for (const part of formData) {
    if (part.name === 'file' && part.filename && part.data) {
      // Get slotId from form data
      const slotIdPart = formData.find((p) => p.name === 'slotId');
      const slotId = slotIdPart?.data?.toString() || 'default';

      const uploadedFile = await storage.uploadFile(caseId, slotId, part.data, part.filename, part.type);

      uploadedFiles.push({
        slotId,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        path: uploadedFile.path,
        uploadedAt: uploadedFile.uploadedAt,
      });
    }
  }

  if (uploadedFiles.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No valid file found in upload' });
  }

  // Update case with new files
  const currentFiles = caseFilesArraySchema.parse(existingCase.files ?? []);

  // Replace or add files for the uploaded slots
  for (const newFile of uploadedFiles) {
    const existingIndex = currentFiles.findIndex((f) => f.slotId === newFile.slotId);
    if (existingIndex >= 0) {
      currentFiles[existingIndex] = newFile;
    } else {
      currentFiles.push(newFile);
    }
  }

  const updatedCase = await prisma.case.update({
    where: { id: caseId },
    data: {
      files: currentFiles,
    },
    include: {
      practice: { select: { id: true, name: true } },
      caseType: { select: { id: true, key: true, label: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return {
    case: updatedCase,
    uploadedFiles,
  };
});
