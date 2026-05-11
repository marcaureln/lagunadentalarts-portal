import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { requireCaseId } from '~~/server/utils/routeParams';
import { ASSIGNABLE_STATUSES, permissions } from '~~/shared/utils/permissions';

const assignSchema = z.object({
  assigneeId: z.string().nullable(),
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const caseId = requireCaseId(event);

  const { assigneeId } = await readValidatedBody(event, assignSchema.parse);

  const existingCase = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, status: true, assignedToId: true },
  });

  if (!existingCase) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' });
  }

  if (!ASSIGNABLE_STATUSES.includes(existingCase.status as (typeof ASSIGNABLE_STATUSES)[number])) {
    throw createError({
      statusCode: 400,
      statusMessage: `Cannot assign a ${existingCase.status.toLowerCase()} case`,
    });
  }

  const allowed =
    permissions.canAssignAny(user.role) ||
    (permissions.canSelfAssign(user.role, existingCase.assignedToId) && assigneeId === user.id);

  if (!allowed) {
    throw createError({ statusCode: 403, statusMessage: 'Not allowed to assign this case' });
  }

  if (assigneeId) {
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { id: true, role: true, practiceId: true },
    });

    if (!assignee || !permissions.isLDAUser(assignee.role) || assignee.practiceId) {
      throw createError({ statusCode: 400, statusMessage: 'Assignee must be a lab user' });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const shouldAutoAccept = assigneeId != null && existingCase.status === 'SUBMITTED';

    const updated = await tx.case.update({
      where: { id: caseId },
      data: {
        assignedToId: assigneeId,
        ...(shouldAutoAccept && { status: 'ACCEPTED' }),
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
        caseId,
        type: assigneeId ? 'ASSIGNED' : 'UNASSIGNED',
        message: updated.assignedTo?.name ?? null,
        createdById: user.id,
      },
    });

    if (shouldAutoAccept) {
      await tx.caseEvent.create({
        data: {
          caseId,
          type: 'STATUS_CHANGED',
          fromStatus: 'SUBMITTED',
          toStatus: 'ACCEPTED',
          createdById: user.id,
        },
      });
    }

    return updated;
  });

  return result;
});
