<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { User } from '~~/server/types/user';
import { roleOptions, getRoleLabel } from '~~/shared/utils/users';

const props = defineProps<{
  practiceId: string;
}>();

const UBadge = resolveComponent('UBadge');
const USelectMenu = resolveComponent('USelectMenu');
const PortalPracticeStaffModalRemove = resolveComponent('PortalPracticeStaffModalRemove');

const toast = useToast();
const { user: currentUser } = useUserSession();

const { data: staff, refresh } = useLazyFetch<User[]>(() => `/api/practices/${props.practiceId}/users`);

defineExpose({ refresh });

const practiceRoleOptions = roleOptions.filter(
  (opt) => opt.value === 'PRACTICE_STAFF' || opt.value === 'PRACTICE_ADMIN'
);

const updateRole = async (user: User, newRole: string) => {
  try {
    await $fetch(`/api/practices/${props.practiceId}/users/${user.id}`, {
      method: 'PATCH',
      body: { role: newRole },
    });
    toast.add({ description: 'Role updated', color: 'success' });
    await refresh();
  } catch (e) {
    console.error('Failed to update role', e);
    toast.add({ description: 'Failed to update role', color: 'error' });
  }
};

const formatDate = (date: Date | string): string =>
  new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

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
        items: practiceRoleOptions,
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
    header: 'Actions',
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original;
      const isCurrentUser = user.email === currentUser.value?.email;
      if (isCurrentUser) return;

      return h('div', {}, [
        h(PortalPracticeStaffModalRemove, {
          user,
          practiceId: props.practiceId,
          onSuccess: refresh,
        }),
      ]);
    },
  },
];
</script>

<template>
  <div class="w-full flex-1 overflow-hidden rounded-lg border border-accented">
    <UTable :data="staff || []" :columns="columns">
      <template #empty>
        <div class="flex flex-col items-center justify-center py-12">
          <UIcon name="i-ri-team-line" class="mb-4 h-12 w-12 text-gray-400" />
          <h3 class="mb-2 text-lg font-medium text-gray-900">No staff yet</h3>
          <p class="max-w-sm text-center text-gray-500">Use “Add Staff” above to get started.</p>
        </div>
      </template>
    </UTable>
  </div>
</template>
