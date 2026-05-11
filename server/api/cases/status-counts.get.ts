import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '~~/server/utils/prisma';
import { permissions, type CaseStatusName } from '~~/shared/utils/permissions';

const querySchema = z.object({
  assignedToId: z.string().optional(),
  caseTypeId: z.string().optional(),
  practiceId: z.string().optional(),
});

const ALL_STATUSES: CaseStatusName[] = [
  'DRAFT',
  'SUBMITTED',
  'NEEDS_INFO',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const params = await getValidatedQuery(event, querySchema.parse);

  const where: Prisma.CaseWhereInput = {};

  if (permissions.canViewAllCases(user.role)) {
    where.status = { not: 'DRAFT' };
    if (params.practiceId) where.practiceId = params.practiceId;
  } else if (permissions.isPracticeUser(user.role) && user.practiceId) {
    where.practiceId = user.practiceId;
  } else {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient permissions' });
  }

  if (params.assignedToId) {
    if (params.assignedToId === 'unassigned') where.assignedToId = null;
    else if (params.assignedToId === 'me') where.assignedToId = user.id;
    else where.assignedToId = params.assignedToId;
  }
  if (params.caseTypeId) where.caseTypeId = params.caseTypeId;

  const rows = await prisma.case.groupBy({
    by: ['status'],
    where,
    _count: { _all: true },
  });

  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<CaseStatusName, number>;
  for (const r of rows) {
    counts[r.status as CaseStatusName] = r._count._all;
  }
  return counts;
});
