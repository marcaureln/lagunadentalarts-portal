import { prisma } from '~~/server/utils/prisma';
import { requireCaseId } from '~~/server/utils/routeParams';
import { permissions } from '~~/shared/utils/permissions';
import type { CaseData } from '~~/shared/types/case';
import { caseFilesArraySchema, caseTypeFieldsArraySchema, caseTypeFileSlotsArraySchema } from '~~/shared/schemas/case';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const caseId = requireCaseId(event);

  // Fetch the case with case type for validation
  const existingCase = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      caseType: true,
    },
  });

  if (!existingCase) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Case not found',
    });
  }

  if (!permissions.canEditCase(user.role, user.practiceId, existingCase.practiceId, existingCase.status)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot submit this case.',
    });
  }

  if (existingCase.status !== 'DRAFT' && existingCase.status !== 'NEEDS_INFO') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only DRAFT or NEEDS_INFO cases can be submitted',
    });
  }

  // Validate required fields from case type
  const fields = caseTypeFieldsArraySchema.parse(existingCase.caseType.fields ?? []);
  const data = (existingCase.data ?? {}) as CaseData;
  const missingFields: string[] = [];

  for (const field of fields) {
    if (field.required) {
      const value = data[field.id];
      if (value === undefined || value === null || value === '') {
        missingFields.push(field.label);
      }
    }
  }

  if (missingFields.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }

  // Validate required file slots
  const fileSlots = caseTypeFileSlotsArraySchema.parse(existingCase.caseType.fileSlots ?? []);
  const files = caseFilesArraySchema.parse(existingCase.files ?? []);
  const missingSlots: string[] = [];

  for (const slot of fileSlots) {
    if (slot.required) {
      const hasFile = files.some((f) => f.slotId === slot.id);
      if (!hasFile) {
        missingSlots.push(slot.label);
      }
    }
  }

  if (missingSlots.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing required files: ${missingSlots.join(', ')}`,
    });
  }

  const fromStatus = existingCase.status;

  const result = await prisma.$transaction(async (tx) => {
    const updatedCase = await tx.case.update({
      where: { id: caseId },
      data: {
        status: 'SUBMITTED',
      },
      include: {
        practice: { select: { id: true, name: true } },
        caseType: { select: { id: true, key: true, label: true } },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    await tx.caseEvent.create({
      data: {
        caseId: caseId,
        type: 'SUBMITTED',
        fromStatus,
        toStatus: 'SUBMITTED',
        createdById: user.id,
      },
    });

    return updatedCase;
  });

  return result;
});
