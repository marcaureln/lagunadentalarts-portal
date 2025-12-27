<script setup lang="ts">
import { getRoleLabel } from '~~/shared/utils/users';

const { user } = useUserSession();

definePageMeta({
  layout: 'portal',
});
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-2 text-sm text-gray-600">Welcome back, {{ user?.name }}!</p>
    </div>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <UIcon name="i-ri-user-line" class="h-5 w-5 text-blue-600" />
            </div>
            <h3 class="text-lg font-semibold">Profile</h3>
          </div>
        </template>

        <div class="space-y-3">
          <div>
            <p class="text-sm text-gray-500">Name</p>
            <p class="font-medium">{{ user?.name }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Email</p>
            <p class="font-medium">{{ user?.email }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Role</p>
            <UBadge color="primary" variant="soft">{{ getRoleLabel(user.role) }}</UBadge>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
