import { z } from 'zod';
import type { CaseStatus } from '@prisma/client';
import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';

const querySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(8),
});

interface SearchRow {
  id: string;
  patientName: string;
  patientExternalId: string | null;
  status: CaseStatus;
  data: unknown;
  files: unknown;
  boxFolderId: string | null;
  practiceId: string;
  practiceName: string;
  caseTypeId: string;
  caseTypeKey: string;
  caseTypeLabel: string;
  createdById: string;
  createdByName: string;
  assignedToId: string | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: SearchRow) {
  return {
    id: row.id,
    patientName: row.patientName,
    patientExternalId: row.patientExternalId,
    status: row.status,
    data: row.data,
    files: row.files,
    boxFolderId: row.boxFolderId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    practice: { id: row.practiceId, name: row.practiceName },
    caseType: { id: row.caseTypeId, key: row.caseTypeKey, label: row.caseTypeLabel },
    createdBy: { id: row.createdById, name: row.createdByName },
    assignedTo: row.assignedToId ? { id: row.assignedToId, name: row.assignedToName } : null,
  };
}

const selectClause = `
  c.id,
  c."patientName",
  c."patientExternalId",
  c.status,
  c.data,
  c.files,
  c."boxFolderId",
  c."createdAt",
  c."updatedAt",
  p.id AS "practiceId",
  p.name AS "practiceName",
  ct.id AS "caseTypeId",
  ct.key AS "caseTypeKey",
  ct.label AS "caseTypeLabel",
  u.id AS "createdById",
  u.name AS "createdByName",
  a.id AS "assignedToId",
  a.name AS "assignedToName"
`;

const tsvExpression = `
  to_tsvector('english',
    c."patientName" || ' ' ||
    COALESCE(c."patientExternalId", '') || ' ' ||
    p.name || ' ' ||
    ct.label || ' ' ||
    u.name
  )
`;

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { q, limit } = await getValidatedQuery(event, querySchema.parse);

  if (permissions.canViewAllCases(user.role)) {
    const rows = await prisma.$queryRawUnsafe<SearchRow[]>(
      `SELECT ${selectClause}
       FROM "Case" c
       JOIN "Practice" p ON c."practiceId" = p.id
       JOIN "CaseType" ct ON c."caseTypeId" = ct.id
       JOIN "User" u ON c."createdById" = u.id
       LEFT JOIN "User" a ON c."assignedToId" = a.id
       WHERE c.status != 'DRAFT'
         AND ${tsvExpression} @@ plainto_tsquery('english', $1)
       ORDER BY ts_rank(${tsvExpression}, plainto_tsquery('english', $1)) DESC
       LIMIT $2`,
      q,
      limit
    );
    return rows.map(mapRow);
  }

  if (permissions.isPracticeUser(user.role) && user.practiceId) {
    const rows = await prisma.$queryRawUnsafe<SearchRow[]>(
      `SELECT ${selectClause}
       FROM "Case" c
       JOIN "Practice" p ON c."practiceId" = p.id
       JOIN "CaseType" ct ON c."caseTypeId" = ct.id
       JOIN "User" u ON c."createdById" = u.id
       LEFT JOIN "User" a ON c."assignedToId" = a.id
       WHERE c."practiceId" = $1
         AND ${tsvExpression} @@ plainto_tsquery('english', $2)
       ORDER BY ts_rank(${tsvExpression}, plainto_tsquery('english', $2)) DESC
       LIMIT $3`,
      user.practiceId,
      q,
      limit
    );
    return rows.map(mapRow);
  }

  throw createError({
    statusCode: 403,
    statusMessage: 'Insufficient permissions',
  });
});
