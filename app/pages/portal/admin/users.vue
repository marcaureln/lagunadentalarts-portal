<script setup lang="ts">
import type { User } from '~~/shared/utils/users';
import { roleOptions, getRoleLabel } from '~~/shared/utils/users';

definePageMeta({
  layout: 'portal',
  middleware: async () => {
    const { user } = useUserSession();
    if ((user.value as { role?: string })?.role !== 'ADMIN') {
      return navigateTo('/portal');
    }
  },
});

const { data: users, refresh } = await useFetch<User[]>('/api/admin/users');
const { user: currentUser } = useUserSession();

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'createdAt', header: 'Created At' },
  { id: 'actions', header: 'Actions' },
];

const updateRole = async (user: User, newRole: string) => {
  try {
    await $fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      body: { role: newRole },
    });
    await refresh();
  } catch (e) {
    console.error('Failed to update role', e);
  }
};

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString();
};
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
        <p class="mt-2 text-sm text-gray-600">Manage user access and roles for the portal</p>
      </div>
      <PortalAdminModalAddUser @success="refresh" />
    </div>

    <UCard>
      <UTable :data="users || []" :columns="columns">
        <template #email-cell="{ row }">
          <span>{{ row.getValue('email') as string }}</span>
        </template>

        <template #name-cell="{ row }">
          <span class="font-medium">{{ (row.getValue('name') as string) || '—' }}</span>
        </template>

        <template #role-cell="{ row }">
          <div v-if="((row.getValue('email') as string) ?? '') !== (currentUser?.email ?? '')">
            <USelectMenu
              :model-value="row.getValue('role')"
              :items="roleOptions"
              value-key="value"
              :search-input="false"
              @update:model-value="updateRole(row.original as User, $event)"
            />
          </div>
          <div v-else class="text-sm font-medium text-gray-900">
            {{ getRoleLabel(row.getValue('role')) }}
          </div>
        </template>

        <template #createdAt-cell="{ row }">
          <span class="text-gray-500">{{ formatDate(row.getValue('createdAt') as string) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <div v-if="((row.getValue('email') as string) ?? '') !== (currentUser?.email ?? '')">
            <PortalAdminModalRemoveUser :user="row.original as User" @success="refresh" />
          </div>
        </template>

        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-12">
            <UIcon name="i-ri-user-line" class="mb-4 h-12 w-12 text-gray-400" />
            <h3 class="mb-2 text-lg font-medium text-gray-900">No users found</h3>
            <p class="max-w-sm text-center text-gray-500">
              {{ users ? 'No users exist in the system yet.' : 'Loading users...' }}
            </p>
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
