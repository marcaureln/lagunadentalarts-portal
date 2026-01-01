import { prisma } from '~~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  // All authenticated users can view case types
  const caseTypes = await prisma.caseType.findMany({
    where: { isActive: true },
    orderBy: { label: 'asc' },
  });

  return caseTypes;
});
