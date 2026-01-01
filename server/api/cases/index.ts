import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';

const createCaseSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  patientExternalId: z.string().optional(),
  caseTypeId: z.string().min(1, 'Case type is required'),
});

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  if (event.node.req.method === 'GET') {
    // LDA users can view all cases, practice users can only view their own
    if (permissions.canViewAllCases(user.role)) {
      const cases = await prisma.case.findMany({
        include: {
          practice: { select: { id: true, name: true } },
          caseType: { select: { id: true, key: true, label: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return cases;
    }

    if (permissions.isPracticeUser(user.role) && user.practiceId) {
      const cases = await prisma.case.findMany({
        where: { practiceId: user.practiceId },
        include: {
          practice: { select: { id: true, name: true } },
          caseType: { select: { id: true, key: true, label: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return cases;
    }

    throw createError({
      statusCode: 403,
      statusMessage: 'Insufficient permissions',
    });
  }

  if (event.node.req.method === 'POST') {
    // Only practice users can create cases
    if (!permissions.canCreateCase(user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only practice users can create cases',
      });
    }

    if (!user.practiceId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User must be associated with a practice to create cases',
      });
    }

    const body = await readValidatedBody(event, createCaseSchema.parse);

    // Verify case type exists
    const caseType = await prisma.caseType.findUnique({
      where: { id: body.caseTypeId },
    });

    if (!caseType) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid case type',
      });
    }

    // Create case and initial event in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newCase = await tx.case.create({
        data: {
          patientName: body.patientName,
          patientExternalId: body.patientExternalId,
          caseTypeId: body.caseTypeId,
          practiceId: user.practiceId!,
          createdById: user.id,
          status: 'DRAFT',
          data: {},
          files: [],
        },
        include: {
          practice: { select: { id: true, name: true } },
          caseType: { select: { id: true, key: true, label: true, fields: true, fileSlots: true, instructions: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      // Create CREATED event
      await tx.caseEvent.create({
        data: {
          caseId: newCase.id,
          type: 'CREATED',
          toStatus: 'DRAFT',
          createdById: user.id,
        },
      });

      return newCase;
    });

    return result;
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});
