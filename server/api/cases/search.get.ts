import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';

const querySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(8),
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { q, limit } = await getValidatedQuery(event, querySchema.parse);

  const searchFilter = {
    OR: [
      { patientName: { contains: q, mode: 'insensitive' as const } },
      { patientExternalId: { contains: q, mode: 'insensitive' as const } },
      { practice: { name: { contains: q, mode: 'insensitive' as const } } },
      { caseType: { label: { contains: q, mode: 'insensitive' as const } } },
      { createdBy: { name: { contains: q, mode: 'insensitive' as const } } },
    ],
  };

  const include = {
    practice: { select: { id: true, name: true } },
    caseType: { select: { id: true, key: true, label: true } },
    createdBy: { select: { id: true, name: true } },
    assignedTo: { select: { id: true, name: true } },
  };

  if (permissions.canViewAllCases(user.role)) {
    const cases = await prisma.case.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { status: { not: 'DRAFT' }, ...searchFilter } as any,
      include,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return cases;
  }

  if (permissions.isPracticeUser(user.role) && user.practiceId) {
    const cases = await prisma.case.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { practiceId: user.practiceId, ...searchFilter } as any,
      include,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return cases;
  }

  throw createError({
    statusCode: 403,
    statusMessage: 'Insufficient permissions',
  });
});
