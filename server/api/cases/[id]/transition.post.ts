import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { permissions, type CaseStatusName } from '~~/shared/utils/permissions';

const transitionSchema = z.object({
  to: z.enum(['SUBMITTED', 'NEEDS_INFO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  message: z.string().trim().min(1).optional(),
});

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event);

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const caseId = getRouterParam(event, 'id');
  if (!caseId) {
    throw createError({ statusCode: 400, statusMessage: 'Case ID is required' });
  }

  const { to, message } = await readValidatedBody(event, transitionSchema.parse);

  if (to === 'NEEDS_INFO' && !message) {
    throw createError({ statusCode: 400, statusMessage: 'A message is required when requesting more info' });
  }

  const existingCase = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, status: true, assignedToId: true, practiceId: true },
  });

  if (!existingCase) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' });
  }

  const fromStatus = existingCase.status as CaseStatusName;

  if (fromStatus === to) {
    throw createError({ statusCode: 400, statusMessage: 'Case is already in this status' });
  }

  const allowed = permissions.canTransition(
    user.role,
    user.id,
    fromStatus,
    to,
    existingCase.assignedToId,
    user.practiceId,
    existingCase.practiceId
  );

  if (!allowed) {
    throw createError({ statusCode: 403, statusMessage: 'Transition not allowed' });
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.case.update({
      where: { id: caseId },
      data: { status: to },
      include: {
        practice: { select: { id: true, name: true } },
        caseType: { select: { id: true, key: true, label: true } },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    await tx.caseEvent.create({
      data: {
        caseId,
        type: 'STATUS_CHANGED',
        fromStatus,
        toStatus: to,
        message: message ?? null,
        createdById: user.id,
      },
    });

    return updated;
  });

  return result;
});
