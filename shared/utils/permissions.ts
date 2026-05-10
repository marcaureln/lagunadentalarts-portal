import type { UserRole } from '~~/server/types/user';

export type CaseStatusName =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'NEEDS_INFO'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

const LAB_ROLES: UserRole[] = ['USER', 'ADMIN'];
const PRACTICE_ROLES: UserRole[] = ['PRACTICE_STAFF', 'PRACTICE_ADMIN'];
const PRACTICE_EDITABLE_STATUSES: CaseStatusName[] = ['DRAFT', 'NEEDS_INFO'];

export const permissions = {
  canManageAllUsers: (role?: UserRole) => role === 'ADMIN',
  canManagePracticeUsers: (role?: UserRole) => role === 'PRACTICE_ADMIN',
  canViewPractices: (role?: UserRole) => role === 'ADMIN',
  canManagePractices: (role?: UserRole) => role === 'ADMIN',
  isPracticeUser: (role?: UserRole) => (role ? PRACTICE_ROLES.includes(role) : false),
  isLDAUser: (role?: UserRole) => (role ? LAB_ROLES.includes(role) : false),
  isAdmin: (role?: UserRole) => (role ? ['ADMIN', 'PRACTICE_ADMIN'].includes(role) : false),
  canManageStaff: (role?: UserRole, userPracticeId?: string | null, targetPracticeId?: string) => {
    if (role === 'ADMIN') return true;
    if (role === 'PRACTICE_ADMIN' && userPracticeId === targetPracticeId) return true;
    return false;
  },
  canCreateCase: (role?: UserRole) => (role ? PRACTICE_ROLES.includes(role) : false),
  canViewCase: (role?: UserRole, userPracticeId?: string | null, casePracticeId?: string, caseStatus?: string) => {
    if (!role) return false;
    if (LAB_ROLES.includes(role)) {
      // Drafts belong to the practice until submitted; the lab should not see them.
      return caseStatus !== 'DRAFT';
    }
    if (PRACTICE_ROLES.includes(role) && userPracticeId === casePracticeId) return true;
    return false;
  },
  canEditCase: (role?: UserRole, userPracticeId?: string | null, casePracticeId?: string, caseStatus?: string) => {
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

  // Single source of truth for status transitions. Returns true if the actor may make this move.
  // SUBMITTED -> ACCEPTED is handled by the assign endpoint, so it returns false here.
  canTransition: (
    role: UserRole | undefined,
    userId: string | undefined,
    fromStatus: CaseStatusName,
    toStatus: CaseStatusName,
    assignedToId: string | null | undefined,
    userPracticeId?: string | null,
    casePracticeId?: string
  ): boolean => {
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
        return ['SUBMITTED', 'ACCEPTED', 'IN_PROGRESS'].includes(fromStatus);
      case 'CANCELLED':
        return ['SUBMITTED', 'NEEDS_INFO', 'ACCEPTED', 'IN_PROGRESS'].includes(fromStatus);
      default:
        return false;
    }
  },
};
