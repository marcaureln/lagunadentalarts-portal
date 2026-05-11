import type { CaseStatus as CaseStatusName } from '@prisma/client';
import type { UserRole } from '~~/server/types/user';

export type { CaseStatusName };

const LAB_ROLES: UserRole[] = ['USER', 'ADMIN'];
const PRACTICE_ROLES: UserRole[] = ['PRACTICE_STAFF', 'PRACTICE_ADMIN'];
const PRACTICE_EDITABLE_STATUSES: CaseStatusName[] = ['DRAFT', 'NEEDS_INFO'];

export const ASSIGNABLE_STATUSES: readonly CaseStatusName[] = ['SUBMITTED', 'ACCEPTED', 'IN_PROGRESS'] as const;
export const REQUESTABLE_INFO_STATUSES: readonly CaseStatusName[] = ['SUBMITTED', 'ACCEPTED', 'IN_PROGRESS'] as const;
export const CANCELLABLE_STATUSES: readonly CaseStatusName[] = [
  'SUBMITTED',
  'NEEDS_INFO',
  'ACCEPTED',
  'IN_PROGRESS',
] as const;
export const TERMINAL_STATUSES: readonly CaseStatusName[] = ['COMPLETED', 'CANCELLED'] as const;
export const SUBMITTABLE_STATUSES: readonly CaseStatusName[] = ['DRAFT', 'NEEDS_INFO'] as const;

export const permissions = {
  canManageAllUsers: (role?: UserRole) => role === 'ADMIN',
  canManagePracticeUsers: (role?: UserRole) => role === 'PRACTICE_ADMIN',
  canViewPractices: (role?: UserRole) => role === 'ADMIN',
  canManagePractices: (role?: UserRole) => role === 'ADMIN',
  isPracticeUser: (role?: UserRole) => (role ? PRACTICE_ROLES.includes(role) : false),
  isLabUser: (role?: UserRole) => (role ? LAB_ROLES.includes(role) : false),
  isLabAdmin: (role?: UserRole) => role === 'ADMIN',
  isPracticeAdmin: (role?: UserRole) => role === 'PRACTICE_ADMIN',
  isAdmin: (role?: UserRole) => (role ? ['ADMIN', 'PRACTICE_ADMIN'].includes(role) : false),
  canManageStaff: (role?: UserRole, userPracticeId?: string | null, targetPracticeId?: string) => {
    if (role === 'ADMIN') return true;
    if (role === 'PRACTICE_ADMIN' && userPracticeId === targetPracticeId) return true;
    return false;
  },
  canCreateCase: (role?: UserRole) => (role ? PRACTICE_ROLES.includes(role) : false),
  canViewCase: (args: {
    role?: UserRole;
    userPracticeId?: string | null;
    casePracticeId?: string;
    caseStatus?: string;
  }) => {
    const { role, userPracticeId, casePracticeId, caseStatus } = args;
    if (!role) return false;
    if (LAB_ROLES.includes(role)) {
      // Drafts belong to the practice until submitted; the lab should not see them.
      return caseStatus !== 'DRAFT';
    }
    if (PRACTICE_ROLES.includes(role) && userPracticeId === casePracticeId) return true;
    return false;
  },
  canEditCase: (args: {
    role?: UserRole;
    userPracticeId?: string | null;
    casePracticeId?: string;
    caseStatus?: string;
  }) => {
    const { role, userPracticeId, casePracticeId, caseStatus } = args;
    if (!role) return false;
    if (PRACTICE_ROLES.includes(role) && userPracticeId === casePracticeId) {
      return PRACTICE_EDITABLE_STATUSES.includes(caseStatus as CaseStatusName);
    }
    return false;
  },
  canViewAllCases: (role?: UserRole) => (role ? LAB_ROLES.includes(role) : false),

  canManageResources: (role?: UserRole) => role === 'ADMIN',
  canViewResources: (role?: UserRole) => !!role,

  // Lab manager can assign / reassign / unassign anyone.
  canAssignAny: (role?: UserRole) => role === 'ADMIN',

  // Artist can only self-assign and only when the case is currently unassigned.
  canSelfAssign: (role: UserRole | undefined, currentAssigneeId: string | null | undefined) =>
    role === 'USER' && currentAssigneeId == null,

  // Single source of truth for status transitions. SUBMITTED -> ACCEPTED is handled by the assign endpoint.
  canTransition: (args: {
    role: UserRole | undefined;
    userId: string | undefined;
    fromStatus: CaseStatusName;
    toStatus: CaseStatusName;
    assignedToId: string | null | undefined;
    userPracticeId?: string | null;
    casePracticeId?: string;
  }): boolean => {
    const { role, userId, fromStatus, toStatus, assignedToId, userPracticeId, casePracticeId } = args;
    if (!role) return false;

    // Practice resubmits a NEEDS_INFO case.
    if (fromStatus === 'NEEDS_INFO' && toStatus === 'SUBMITTED') {
      return PRACTICE_ROLES.includes(role) && userPracticeId === casePracticeId;
    }

    if (!LAB_ROLES.includes(role)) return false;

    // Workflow ownership: artist can act only on cases assigned to them; manager always can.
    const ownsCase = role === 'ADMIN' || (assignedToId != null && assignedToId === userId);

    switch (toStatus) {
      case 'ACCEPTED':
        // Reserved for the assign endpoint.
        return false;
      case 'IN_PROGRESS':
        return fromStatus === 'ACCEPTED' && ownsCase;
      case 'COMPLETED':
        return fromStatus === 'IN_PROGRESS' && ownsCase;
      case 'NEEDS_INFO':
        return ASSIGNABLE_STATUSES.includes(fromStatus);
      case 'CANCELLED':
        return CANCELLABLE_STATUSES.includes(fromStatus);
      default:
        return false;
    }
  },

  /**
   * @deprecated Use `permissions.isLabUser` instead. Kept for one-cycle compat during the lab/lda rename.
   */
  isLDAUser: (role?: UserRole) => (role ? LAB_ROLES.includes(role) : false),
};
