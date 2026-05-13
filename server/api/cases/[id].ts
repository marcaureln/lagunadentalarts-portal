import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { requireCaseId } from '~~/server/utils/routeParams';
import { permissions } from '~~/shared/utils/permissions';

const updateCaseSchema = z.object({
  patientId: z.string().nullable().optional(),
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
  const { user } = await requireUserSession(event);
  const caseId = requireCaseId(event);

  // Fetch the case
  const existingCase = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      practice: { select: { id: true, name: true } },
      caseType: { select: { id: true, key: true, label: true, fields: true, fileSlots: true, instructions: true } },
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, avatarUrl: true } },
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

  if (
    !permissions.canViewCase({
      role: user.role,
      userPracticeId: user.practiceId,
      casePracticeId: existingCase.practiceId,
      caseStatus: existingCase.status,
    })
  ) {
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
    if (
      !permissions.canEditCase({
        role: user.role,
        userPracticeId: user.practiceId,
        casePracticeId: existingCase.practiceId,
        caseStatus: existingCase.status,
      })
    ) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Cannot edit this case. Only DRAFT cases owned by your practice can be edited.',
      });
    }

    const body = await readValidatedBody(event, updateCaseSchema.parse);

    const updatedCase = await prisma.$transaction(async (tx) => {
      let patientId = body.patientId;

      // If no existing patient selected but patient name provided, create a new patient
      // Only do this if the case doesn't already have a patient linked
      if (patientId === null && body.patientName && !existingCase.patientId) {
        const newPatient = await tx.patient.create({
          data: {
            name: body.patientName,
            externalId: body.patientExternalId || null,
            practiceId: user.practiceId!,
          },
        });
        patientId = newPatient.id;
      }

      const updated = await tx.case.update({
        where: { id: caseId },
        data: {
          ...(patientId !== undefined && { patientId }),
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

  if (event.node.req.method === 'DELETE') {
    // Only allow deleting DRAFT cases
    if (existingCase.status !== 'DRAFT') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only draft cases can be deleted',
      });
    }

    // Check edit permission (same as edit - must own the case)
    if (
      !permissions.canEditCase({
        role: user.role,
        userPracticeId: user.practiceId,
        casePracticeId: existingCase.practiceId,
        caseStatus: existingCase.status,
      })
    ) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Cannot delete this case',
      });
    }

    await prisma.case.delete({
      where: { id: caseId },
    });

    return { success: true };
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});
