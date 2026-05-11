<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { User } from '~~/server/types/user';
import { getRoleLabel } from '~~/shared/utils/users';
import { formatDate } from '~~/shared/utils/format';

const props = defineProps<{
  practiceId: string;
}>();

const UBadge = resolveComponent('UBadge');
const PortalConfirmDeleteModal = resolveComponent('PortalConfirmDeleteModal');

const { user: currentUser } = useUserSession();

const { data: staff, refresh } = useLazyFetch<User[]>(() => `/api/practices/${props.practiceId}/users`);

defineExpose({ refresh });

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
            endpoint: `/api/practices/${props.practiceId}/users/${user.id}`,
            title: 'Remove Staff',
            triggerLabel: 'Remove',
            confirmLabel: 'Remove',
            successMsg: 'Staff member removed',
            failureMsg: 'Failed to remove staff',
            onSuccess: refresh,
          },
          () => `Remove ${user.email} from this practice? They will no longer be able to sign in.`
        )
      );
    },
  },
];
</script>

<template>
  <div class="w-full flex-1 overflow-hidden rounded-lg border border-accented">
    <UTable :data="staff || []" :columns="columns" @select="onRowSelect">
      <template #empty>
        <div class="flex flex-col items-center justify-center py-12">
          <UIcon name="i-ri-team-line" class="mb-4 h-12 w-12 text-gray-400" />
          <h3 class="mb-2 text-lg font-medium text-gray-900">No staff yet</h3>
          <p class="max-w-sm text-center text-gray-500">Use “Add Staff” above to get started.</p>
        </div>
      </template>
    </UTable>

    <PortalPracticeStaffFormModal
      v-if="editingUser"
      ref="editRef"
      :user="editingUser"
      :practice-id="practiceId"
      @success="onEditSuccess"
      @close="onEditClose"
    />
  </div>
</template>
