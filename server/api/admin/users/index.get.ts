import { prisma } from '~~/server/utils/prisma';
import { requireAdmin } from '~~/server/utils/admin';
import { LAB_ROLES } from '~~/shared/utils/permissions';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const rawPageSize = query.pageSize ? parseInt(query.pageSize as string, 10) : undefined;
  const rawPage = query.page ? parseInt(query.page as string, 10) : undefined;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize ?? DEFAULT_PAGE_SIZE));
  const page = rawPage && rawPage > 0 ? rawPage : 1;
  const skip = (page - 1) * pageSize;

  const where = { role: { in: [...LAB_ROLES] } };
  const select = {
    id: true,
    name: true,
    email: true,
    avatarUrl: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select, orderBy: { createdAt: 'desc' }, take: pageSize, skip }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, pageSize };
});
