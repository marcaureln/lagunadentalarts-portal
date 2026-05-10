<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { User } from '~~/server/types/user';
import { roleOptions, getRoleLabel } from '~~/shared/utils/users';
import { permissions } from '~~/shared/utils/permissions';

const UBadge = resolveComponent('UBadge');
const USelectMenu = resolveComponent('USelectMenu');
const PortalAdminModalRemoveUser = resolveComponent('PortalAdminModalRemoveUser');

definePageMeta({
  middleware: async () => {
    const { user } = useUserSession();
    if (!permissions.canManageAllUsers(user.value?.role)) {
      return navigateTo('/');
    }
  },
});

useSeoMeta({ title: 'LDA Staff' });

const toast = useToast();
const { data: users, refresh } = await useFetch<User[]>('/api/admin/users');
const { user: currentUser } = useUserSession();

const ldaRoleOptions = roleOptions.filter((opt) => opt.value === 'ADMIN' || opt.value === 'USER');

const updateRole = async (user: User, newRole: string) => {
  try {
    await $fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      body: { role: newRole },
    });
    toast.add({ description: 'User role updated successfully', color: 'success' });
    await refresh();
  } catch (e) {
    console.error('Failed to update role', e);
    toast.add({ description: 'Failed to update user role', color: 'error' });
  }
};

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const columns: TableColumn<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.getValue('name') || '—'),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => h('span', {}, row.getValue('email')),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const user = row.original;
      const isCurrentUser = user.email === currentUser.value?.email;

      if (isCurrentUser) {
        const roleLabel = getRoleLabel(row.getValue('role'));
        return h(UBadge, { variant: 'subtle', color: 'primary', class: 'capitalize' }, () => roleLabel);
      }

      return h(USelectMenu, {
        modelValue: row.getValue('role'),
        items: ldaRoleOptions,
        valueKey: 'value',
        searchInput: false,
        'onUpdate:modelValue': (newRole: string) => updateRole(user, newRole),
      });
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => h('span', { class: 'text-gray-500' }, formatDate(row.getValue('createdAt'))),
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right' }, 'Actions'),
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original;
      const isCurrentUser = user.email === currentUser.value?.email;
      if (isCurrentUser) return;

      return h(
        'div',
        { class: 'flex justify-end', onClick: (e: Event) => e.stopPropagation() },
        h(PortalAdminModalRemoveUser, { user, onSuccess: refresh })
      );
    },
  },
];
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="LDA Staff">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <PortalAdminModalAddUser @success="refresh" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full flex-1 overflow-hidden rounded-lg border border-accented">
        <UTable :data="users || []" :columns="columns">
          <template #empty>
            <div class="flex flex-col items-center justify-center py-8">
              <UIcon name="i-ri-user-line" class="mb-3 h-10 w-10 text-gray-400" />
              <h3 class="mb-1 text-base font-medium text-gray-900">No staff found</h3>
              <p class="max-w-sm text-center text-sm text-gray-500">
                {{ users ? 'No LDA staff exist yet.' : 'Loading staff…' }}
              </p>
            </div>
          </template>
        </UTable>
      </div>
    </template>
  </UDashboardPanel>
</template>
