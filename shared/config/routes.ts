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
          { name: 'Home', href: '/portal', icon: 'i-ri-home-line' },
          { name: 'Users', href: '/portal/admin/users', icon: 'i-ri-user-settings-line' },
          { name: 'Practices', href: '/portal/admin/practices', icon: 'i-ri-building-line' },
        ];
      case 'PRACTICE_ADMIN':
        return [
          { name: 'Home', href: '/portal', icon: 'i-ri-home-line' },
          { name: 'Staff', href: '/portal/practice/staff', icon: 'i-ri-team-line' },
        ];
      case 'USER':
      case 'PRACTICE_STAFF':
      default:
        return [{ name: 'Home', href: '/portal', icon: 'i-ri-home-line' }];
    }
  },
};
