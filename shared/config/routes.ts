import type { UserRole } from '~~/server/types/user';

export interface RouteConfig {
  name: string;
  href: string;
  icon: string;
}

const RESOURCES_LINK: RouteConfig = { name: 'Resources', href: '/resources', icon: 'i-ri-folder-download-line' };

export const routes = {
  getAccessibleRoutes: (role?: UserRole): RouteConfig[] => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Home', href: '/', icon: 'i-ri-home-line' },
          { name: 'Cases', href: '/cases', icon: 'i-ri-folder-line' },
          RESOURCES_LINK,
          { name: 'Users', href: '/admin/users', icon: 'i-ri-user-settings-line' },
          { name: 'Practices', href: '/admin/practices', icon: 'i-ri-building-line' },
          { name: 'Resources', href: '/admin/resources', icon: 'i-ri-file-upload-line' },
        ];
      case 'PRACTICE_ADMIN':
        return [
          { name: 'Home', href: '/', icon: 'i-ri-home-line' },
          { name: 'Cases', href: '/cases', icon: 'i-ri-folder-line' },
          RESOURCES_LINK,
          { name: 'Staff', href: '/practice/staff', icon: 'i-ri-team-line' },
        ];
      case 'USER':
      case 'PRACTICE_STAFF':
      default:
        return [
          { name: 'Home', href: '/', icon: 'i-ri-home-line' },
          { name: 'Cases', href: '/cases', icon: 'i-ri-folder-line' },
          RESOURCES_LINK,
        ];
    }
  },
};
