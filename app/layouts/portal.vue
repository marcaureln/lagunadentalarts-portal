<script setup lang="ts">
import { getRoleLabel } from '~~/shared/utils/users';
import { permissions } from '~~/shared/utils/permissions';

const { user } = useUserSession();
const role = computed(() => getRoleLabel(user.value?.role));

const navigation = computed(() => {
  const currentPath = useRoute().path;
  return permissions.getAccessibleRoutes(user.value?.role).map((item) => ({
    ...item,
    current: item.href === currentPath || (item.href !== '/portal' && currentPath.startsWith(item.href)),
  }));
});

async function logout() {
  await navigateTo('/auth/logout', { external: true });
}
</script>

<template>
  <UApp>
    <!-- Sidebar -->
    <div class="fixed inset-y-0 left-0 w-64 border-r border-gray-200 bg-white">
      <div class="flex h-full flex-col">
        <!-- Logo -->
        <div class="flex h-16 items-center border-b border-gray-200 px-6">
          <img src="/logo.png" alt="Laguna Dental Arts" class="h-8 w-auto" />
        </div>

        <!-- Navigation -->
        <nav class="flex-1 space-y-1 px-3 py-4">
          <NuxtLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            :class="[
              item.current ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
            ]"
          >
            <UIcon :name="item.icon" class="h-5 w-5" />
            {{ item.name }}
          </NuxtLink>
        </nav>
      </div>
    </div>

    <!-- Main content -->
    <div class="pl-64">
      <!-- Top header -->
      <header class="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
        <div class="flex items-center gap-4">
          <UIcon name="i-ri-search-line" class="h-5 w-5 text-gray-400" />
        </div>

        <!-- User profile -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 font-semibold text-white">
              {{ ((user as any)?.name || 'U').charAt(0).toUpperCase() }}
            </div>
            <div class="text-sm">
              <div class="font-medium text-gray-900">{{ (user as any)?.name || 'User' }}</div>
              <div class="text-gray-500">{{ role }}</div>
            </div>
          </div>
          <UButton color="neutral" variant="ghost" icon="i-ri-logout-box-r-line" @click="logout"> Logout </UButton>
        </div>
      </header>

      <!-- Page content -->
      <main class="p-6">
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
