<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { User } from '~~/server/types/user';
import { getRoleLabel } from '~~/shared/utils/users';
import { formatDate } from '~~/shared/utils/format';

const UBadge = resolveComponent('UBadge');
const PortalConfirmDeleteModal = resolveComponent('PortalConfirmDeleteModal');

definePageMeta({ middleware: 'admin-only' });

useSeoMeta({ title: 'LDA Staff' });

const { data: users, error: usersError, refresh } = await useFetch<User[]>('/api/admin/users');
const { user: currentUser } = useUserSession();

const editingUser = ref<User | null>(null);
const editRef = ref<{ open: () => void } | null>(null);

const openEditUser = (user: User) => {
  editingUser.value = user;
  nextTick(() => {
    editRef.value?.open();
  });
};

const onEditSuccess = async () => {
  await refresh();
};

const onEditClose = () => {
  editingUser.value = null;
};

const onRowSelect = (_e: Event, row: TableRow<User>) => {
  openEditUser(row.original);
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
    cell: ({ row }) =>
      h(UBadge, { variant: 'subtle', color: 'primary', class: 'capitalize' }, () => getRoleLabel(row.getValue('role'))),
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
        h(
          PortalConfirmDeleteModal,
          {
            endpoint: `/api/admin/users/${user.id}`,
            title: 'Delete User',
            triggerLabel: 'Delete',
            confirmLabel: 'Delete',
            successMsg: 'User deleted successfully',
            failureMsg: 'Failed to delete user',
            onSuccess: refresh,
          },
          () => `Are you sure you want to delete ${user.email}? They will no longer be able to sign in.`
        )
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
          <PortalAdminUserFormModal @success="refresh" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full flex-1 overflow-hidden rounded-lg border border-accented">
        <UTable :data="users || []" :columns="columns" @select="onRowSelect">
          <template #empty>
            <div v-if="usersError" class="flex flex-col items-center justify-center py-8">
              <UIcon name="i-ri-error-warning-line" class="mb-3 h-10 w-10 text-error" />
              <h3 class="mb-1 text-base font-medium text-gray-900">Failed to load staff</h3>
              <UButton class="mt-2" variant="outline" @click="refresh()">Retry</UButton>
            </div>
            <div v-else class="flex flex-col items-center justify-center py-8">
              <UIcon name="i-ri-user-line" class="mb-3 h-10 w-10 text-gray-400" />
              <h3 class="mb-1 text-base font-medium text-gray-900">No staff found</h3>
              <p class="max-w-sm text-center text-sm text-gray-500">
                {{ users ? 'No LDA staff exist yet.' : 'Loading staff…' }}
              </p>
            </div>
          </template>
        </UTable>
      </div>

      <PortalAdminUserFormModal
        v-if="editingUser"
        ref="editRef"
        :user="editingUser"
        @success="onEditSuccess"
        @close="onEditClose"
      />
    </template>
  </UDashboardPanel>
</template>
