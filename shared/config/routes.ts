import type { UserRole } from '~~/server/types/user';

export interface RouteConfig {
  name: string;
  href: string;
  icon: string;
}

export const routes = {
  getAccessibleRoutes: (role?: UserRole): RouteConfig[] => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Home', href: '/', icon: 'i-ri-home-line' },
          { name: 'Cases', href: '/cases', icon: 'i-ri-folder-line' },
          { name: 'Users', href: '/admin/users', icon: 'i-ri-user-settings-line' },
          { name: 'Practices', href: '/admin/practices', icon: 'i-ri-building-line' },
        ];
      case 'PRACTICE_ADMIN':
        return [
          { name: 'Home', href: '/', icon: 'i-ri-home-line' },
          { name: 'Cases', href: '/cases', icon: 'i-ri-folder-line' },
          { name: 'Staff', href: '/practice/staff', icon: 'i-ri-team-line' },
        ];
      case 'USER':
      case 'PRACTICE_STAFF':
      default:
        return [
          { name: 'Home', href: '/', icon: 'i-ri-home-line' },
          { name: 'Cases', href: '/cases', icon: 'i-ri-folder-line' },
        ];
    }
  },
};
