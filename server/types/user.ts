import type { User as PrismaUser, Role, Practice as PrismaPractice } from '@prisma/client';

export type UserRole = Role;

export type Practice = PrismaPractice;

// Server-side type that matches Prisma exactly - source of truth
export type ServerUser = PrismaUser;

// Client-safe User type (JSON serializable)
// Date objects become strings when sent over JSON
export type User = Omit<PrismaUser, 'createdAt' | 'updatedAt' | 'passwordHash' | 'passwordExpiresAt'> & {
  createdAt: string;
  updatedAt: string;
  passwordExpiresAt?: string | null;
  practice?: Practice;
};
