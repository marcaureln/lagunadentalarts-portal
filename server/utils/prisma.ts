import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL + '?sslmode=no-verify';
const isSecureDb = /(localhost|127\.0\.0\.1)/.test(databaseUrl);
const connectionString = databaseUrl + (isSecureDb ? `?sslmode=no-verify` : '');
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };
