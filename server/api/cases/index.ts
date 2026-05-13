import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';

const createCaseSchema = z.object({
  patientId: z.string().nullable().optional(),
  patientName: z.string().min(1, 'Patient name is required'),
  patientExternalId: z.string().nullable().optional(),
  caseTypeId: z.string().min(1, 'Case type is required'),
  data: z.record(z.string(), z.any()).optional(),
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  if (event.node.req.method === 'GET') {
    const query = getQuery(event);
    const status = query.status as string | undefined;
    const limit = query.limit ? parseInt(query.limit as string, 10) : undefined;
    const assignee = query.assignedToId as string | undefined;
    const caseTypeId = query.caseTypeId as string | undefined;
    const practiceIdFilter = query.practiceId as string | undefined;

    const statusFilter = status
      ? status === 'IN_PROGRESS'
        ? { status: { in: ['ACCEPTED' as const, 'IN_PROGRESS' as const] } }
        : { status: status as 'DRAFT' | 'SUBMITTED' | 'NEEDS_INFO' | 'COMPLETED' | 'CANCELLED' }
      : {};

    const assigneeFilter =
      assignee === 'me'
        ? { assignedToId: user.id }
        : assignee === 'unassigned'
          ? { assignedToId: null }
          : assignee
            ? { assignedToId: assignee }
            : {};

    const caseTypeFilter = caseTypeId ? { caseTypeId } : {};

    const include = {
      practice: { select: { id: true, name: true } },
      caseType: { select: { id: true, key: true, label: true } },
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      _count: {
        select: {
          events: { where: { type: 'FILE_DOWNLOADED' as const } },
        },
      },
    };

    if (permissions.canViewAllCases(user.role)) {
      const cases = await prisma.case.findMany({
        where: {
          status: { not: 'DRAFT' },
          ...statusFilter,
          ...assigneeFilter,
          ...caseTypeFilter,
          ...(practiceIdFilter && { practiceId: practiceIdFilter }),
        },
        include,
        orderBy: { createdAt: 'desc' },
        ...(limit && { take: limit }),
      });
      return cases;
    }

    if (permissions.isPracticeUser(user.role) && user.practiceId) {
      const cases = await prisma.case.findMany({
        where: { practiceId: user.practiceId, ...statusFilter, ...caseTypeFilter },
        include,
        orderBy: { createdAt: 'desc' },
        ...(limit && { take: limit }),
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
      let patientId = body.patientId || null;

      // If no existing patient selected, create a new one
      if (!patientId && body.patientName) {
        const newPatient = await tx.patient.create({
          data: {
            name: body.patientName,
            externalId: body.patientExternalId || null,
            practiceId: user.practiceId!,
          },
        });
        patientId = newPatient.id;
      }

      const newCase = await tx.case.create({
        data: {
          patientId,
          patientName: body.patientName,
          patientExternalId: body.patientExternalId,
          caseTypeId: body.caseTypeId,
          practiceId: user.practiceId!,
          createdById: user.id,
          status: 'DRAFT',
          data: body.data || {},
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
