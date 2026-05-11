import { z } from 'zod';
import { prisma } from '~~/server/utils/prisma';
import { permissions } from '~~/shared/utils/permissions';

const createPatientSchema = z.object({
  name: z.string().min(1, 'Patient name is required'),
  externalId: z.string().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  if (!permissions.isPracticeUser(user.role) || !user.practiceId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only practice users can access patients',
    });
  }

  if (event.node.req.method === 'GET') {
    const query = getQuery(event);
    const search = (query.search as string) || '';

    const patients = await prisma.patient.findMany({
      where: {
        practiceId: user.practiceId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { externalId: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ name: 'asc' }],
      take: 20,
    });

    return patients;
  }

  if (event.node.req.method === 'POST') {
    const body = await readValidatedBody(event, createPatientSchema.parse);

    // Check if patient with same externalId already exists for this practice
    if (body.externalId) {
      const existing = await prisma.patient.findUnique({
        where: {
          practiceId_externalId: {
            practiceId: user.practiceId,
            externalId: body.externalId,
          },
        },
      });

      if (existing) {
        throw createError({
          statusCode: 400,
          statusMessage: 'A patient with this external ID already exists',
        });
      }
    }

    const patient = await prisma.patient.create({
      data: {
        name: body.name,
        externalId: body.externalId || null,
        practiceId: user.practiceId,
      },
    });

    return patient;
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
});
