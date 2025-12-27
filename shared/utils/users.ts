import type { UserRole } from '~~/server/types/user';

// Re-export user types from server/types/user to avoid duplication
export type { User, UserRole } from '~~/server/types/user';

export const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: 'Practice Staff', value: 'PRACTICESTAFF' },
  { label: 'Admin', value: 'ADMIN' },
];

export function getRoleLabel(role: UserRole | null): string {
  if (!role) return 'No role';
  const option = roleOptions.find((opt) => opt.value === role);
  return option?.label || role;
}
