import type { UserRole } from '~~/server/types/user';

export const permissions = {
  canManageAllUsers: (role?: UserRole) => role === 'ADMIN',
  canManagePracticeUsers: (role?: UserRole) => role === 'PRACTICE_ADMIN',
  canViewPractices: (role?: UserRole) => role === 'ADMIN',
  canManagePractices: (role?: UserRole) => role === 'ADMIN',
  isPracticeUser: (role?: UserRole) => (role ? ['PRACTICE_STAFF', 'PRACTICE_ADMIN'].includes(role) : false),
  isLDAUser: (role?: UserRole) => (role ? ['USER', 'ADMIN'].includes(role) : false),
  isAdmin: (role?: UserRole) => (role ? ['ADMIN', 'PRACTICE_ADMIN'].includes(role) : false),
  canManageStaff: (role?: UserRole, userPracticeId?: string | null, targetPracticeId?: string) => {
    if (role === 'ADMIN') return true;
    if (role === 'PRACTICE_ADMIN' && userPracticeId === targetPracticeId) return true;
    return false;
  },
  // Case permissions - only practice users can create/manage their own cases
  canCreateCase: (role?: UserRole) => (role ? ['PRACTICE_STAFF', 'PRACTICE_ADMIN'].includes(role) : false),
  canViewCase: (role?: UserRole, userPracticeId?: string | null, casePracticeId?: string) => {
    if (!role) return false;
    if (['USER', 'ADMIN'].includes(role)) return true; // LDA staff can view all cases
    if (['PRACTICE_STAFF', 'PRACTICE_ADMIN'].includes(role) && userPracticeId === casePracticeId) return true;
    return false;
  },
  canEditCase: (role?: UserRole, userPracticeId?: string | null, casePracticeId?: string, caseStatus?: string) => {
    if (!role) return false;
    // Only practice users can edit their own cases, and only if in DRAFT status
    if (['PRACTICE_STAFF', 'PRACTICE_ADMIN'].includes(role) && userPracticeId === casePracticeId) {
      return caseStatus === 'DRAFT';
    }
    return false;
  },
  canViewAllCases: (role?: UserRole) => (role ? ['USER', 'ADMIN'].includes(role) : false),
};
