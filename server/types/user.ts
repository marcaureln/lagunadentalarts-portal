import type { User as PrismaUser } from '@prisma/client';

export type UserRole = 'ADMIN' | 'PRACTICESTAFF';

// Server-side type that matches Prisma exactly - source of truth
export type ServerUser = PrismaUser;

// Client-safe User type (JSON serializable)
// Date objects become strings when sent over JSON
export type User = Omit<PrismaUser, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};
