import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';

const updateCaseSchema = z.object({
  patientName: z.string().min(1).optional(),
  patientExternalId: z.string().nullable().optional(),
  data: z.record(z.string(), z.any()).optional(),
  files: z
    .array(
      z.object({
        slotId: z.string(),
        fileName: z.string(),
        fileSize: z.number().optional(),
        uploadedAt: z.string().optional(),
      })
    )
    .optional(),
});

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const caseId = getRouterParam(event, 'id');

  if (!caseId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Case ID is required',
    });
  }

  // Fetch the case
  const existingCase = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      practice: { select: { id: true, name: true } },
      caseType: { select: { id: true, key: true, label: true, fields: true, fileSlots: true, instructions: true } },
      createdBy: { select: { id: true, name: true } },
      events: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!existingCase) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Case not found',
    });
  }

  // Check view permission
  if (!permissions.canViewCase(user.role, user.practiceId, existingCase.practiceId)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Insufficient permissions',
    });
  }

  if (event.node.req.method === 'GET') {
    return existingCase;
  }

  if (event.node.req.method === 'PATCH') {
    // Check edit permission
    if (!permissions.canEditCase(user.role, user.practiceId, existingCase.practiceId, existingCase.status)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Cannot edit this case. Only DRAFT cases owned by your practice can be edited.',
      });
    }

    const body = await readValidatedBody(event, updateCaseSchema.parse);

    const updatedCase = await prisma.$transaction(async (tx) => {
      const updated = await tx.case.update({
        where: { id: caseId },
        data: {
          ...(body.patientName && { patientName: body.patientName }),
          ...(body.patientExternalId !== undefined && { patientExternalId: body.patientExternalId }),
          ...(body.data && { data: body.data }),
          ...(body.files && { files: body.files }),
        },
        include: {
          practice: { select: { id: true, name: true } },
          caseType: { select: { id: true, key: true, label: true, fields: true, fileSlots: true, instructions: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      // Create UPDATED event
      await tx.caseEvent.create({
        data: {
          caseId: caseId,
          type: 'UPDATED',
          createdById: user.id,
        },
      });

      return updated;
    });

    return updatedCase;
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});
