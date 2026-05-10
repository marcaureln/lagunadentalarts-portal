<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { User, UserRole } from '~~/server/types/user';
import type { Practice } from '~~/shared/types/practice';
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

const route = useRoute();
const toast = useToast();
const { data: users, refresh } = await useFetch<User[]>('/api/admin/users');
const { data: practices } = await useFetch<Practice[]>('/api/practices');
const { user: currentUser } = useUserSession();

const table = useTemplateRef('table');

// Filter state
const selectedPracticeId = ref<string | null>((route.query.practiceId as string) || null);
const selectedRole = ref<UserRole | null>(null);

// Filtered users
const filteredUsers = computed(() => {
  if (!users.value) return [];

  let filtered = users.value;

  if (selectedPracticeId.value) {
    filtered = filtered.filter((u) => u.practiceId === selectedPracticeId.value);
  }

  if (selectedRole.value) {
    filtered = filtered.filter((u) => u.role === selectedRole.value);
  }

  return filtered;
});

// Practice filter options
const practiceOptions = computed(() => {
  if (!practices.value) return [];
  return [{ label: 'All Practices', value: null }, ...practices.value.map((p) => ({ label: p.name, value: p.id }))];
});

// Role filter options
const roleFilterOptions = computed(() => [{ label: 'All Roles', value: null }, ...roleOptions]);

const updateRole = async (user: User, newRole: string) => {
  try {
    await $fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      body: { role: newRole },
    });
    toast.add({
      description: 'User role updated successfully',
      color: 'success',
    });
    await refresh();
  } catch (e) {
    console.error('Failed to update role', e);
    toast.add({
      description: 'Failed to update user role',
      color: 'error',
    });
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
        items: roleOptions,
        valueKey: 'value',
        searchInput: false,
        'onUpdate:modelValue': (newRole: string) => updateRole(user, newRole),
      });
    },
  },
  {
    accessorKey: 'practice',
    header: 'Practice',
    cell: ({ row }) => {
      const practice = row.original.practice;
      return h('span', { class: practice ? 'text-gray-600' : 'text-gray-400' }, practice?.name || '—');
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
        h(PortalAdminModalRemoveUser, {
          user,
          onSuccess: refresh,
        }),
      ]);
    },
  },
];
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="User Management">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <PortalAdminModalAddUser @success="refresh" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="divide-accented border-accented w-full flex-1 divide-y rounded-lg border">
        <div class="flex items-center gap-2 overflow-x-auto px-4 py-3.5">
          <USelectMenu
            v-model="selectedPracticeId"
            :items="practiceOptions"
            value-key="value"
            label-key="label"
            placeholder="All Practices"
            size="sm"
            class="w-48"
          />
          <USelectMenu
            v-model="selectedRole"
            :items="roleFilterOptions"
            value-key="value"
            label-key="label"
            placeholder="All Roles"
            size="sm"
            class="w-48"
          />
        </div>

        <UTable ref="table" :data="filteredUsers" :columns="columns">
          <template #empty>
            <div class="flex flex-col items-center justify-center py-8">
              <UIcon name="i-ri-user-line" class="mb-3 h-10 w-10 text-gray-400" />
              <h3 class="mb-1 text-base font-medium text-gray-900">No users found</h3>
              <p class="max-w-sm text-center text-sm text-gray-500">
                {{ users ? 'No users exist in the system yet.' : 'Loading users...' }}
              </p>
            </div>
          </template>
        </UTable>
      </div>
    </template>
  </UDashboardPanel>
</template>
