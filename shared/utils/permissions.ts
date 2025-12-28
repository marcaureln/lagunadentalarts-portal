import type { UserRole } from '~~/server/types/user';

export const permissions = {
  canManageAllUsers: (role: UserRole) => role === 'ADMIN',
  canManagePracticeUsers: (role: UserRole) => role === 'PRACTICE_ADMIN',
  canViewPractices: (role: UserRole) => role === 'ADMIN',
  canManagePractices: (role: UserRole) => role === 'ADMIN',
  isPracticeUser: (role: UserRole) => ['PRACTICE_STAFF', 'PRACTICE_ADMIN'].includes(role),
  isLDAUser: (role: UserRole) => ['USER', 'ADMIN'].includes(role),
  isAdmin: (role: UserRole) => ['ADMIN', 'PRACTICE_ADMIN'].includes(role),
  canManageStaff: (role: UserRole, userPracticeId: string | null, targetPracticeId: string) => {
    if (role === 'ADMIN') return true;
    if (role === 'PRACTICE_ADMIN' && userPracticeId === targetPracticeId) return true;
    return false;
  },
  getAccessibleRoutes: (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Home', href: '/portal', icon: 'i-ri-home-line' },
          { name: 'User Management', href: '/portal/admin/users', icon: 'i-ri-user-settings-line' },
          { name: 'Practice Management', href: '/portal/admin/practices', icon: 'i-ri-building-line' },
        ];
      case 'PRACTICE_ADMIN':
        return [
          { name: 'Home', href: '/portal', icon: 'i-ri-home-line' },
          { name: 'Staff Management', href: '/portal/practice/staff', icon: 'i-ri-team-line' },
        ];
      case 'USER':
      case 'PRACTICE_STAFF':
      default:
        return [{ name: 'Home', href: '/portal', icon: 'i-ri-home-line' }];
    }
  },
};
