<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import { getRoleLabel } from '~~/shared/utils/users';
import { routes } from '~~/shared/config/routes';

const { user } = useUserSession();
const role = computed(() => getRoleLabel(user.value?.role));

const isMobileSidebarOpen = ref(false);

const links = computed(() => {
  const accessibleRoutes = routes.getAccessibleRoutes(user.value?.role);

  const homeRoute = accessibleRoutes.find((r) => r.href === '/');
  const adminRoutes = accessibleRoutes.filter((r) => r.href.startsWith('/admin'));
  const otherRoutes = accessibleRoutes.filter((r) => r.href !== '/' && !r.href.startsWith('/admin'));

  const items: NavigationMenuItem[] = [];

  if (homeRoute) {
    items.push({
      label: homeRoute.name,
      icon: homeRoute.icon,
      to: homeRoute.href,
      onSelect: () => {
        isMobileSidebarOpen.value = false;
      },
    });
  }

  otherRoutes.forEach((route) => {
    items.push({
      label: route.name,
      icon: route.icon,
      to: route.href,
      onSelect: () => {
        isMobileSidebarOpen.value = false;
      },
    });
  });

  if (adminRoutes.length > 0) {
    items.push({
      label: 'Administration',
      icon: 'i-ri-settings-3-line',
      children: adminRoutes.map((route) => ({
        label: route.name,
        icon: route.icon,
        to: route.href,
        onSelect: () => {
          isMobileSidebarOpen.value = false;
        },
      })),
    });
  }

  return [items] satisfies NavigationMenuItem[][];
});

async function logout() {
  await navigateTo('/auth/logout', { external: true });
}
</script>

<template>
  <UApp>
    <UDashboardGroup unit="rem">
      <UDashboardSidebar id="portal" v-model:open="isMobileSidebarOpen" collapsible resizable>
        <template #header="{ collapsed }">
          <NuxtLink to="/" class="mx-auto">
            <img v-if="!collapsed" src="/logo.png" alt="Laguna Dental Arts" class="h-14" />
            <img v-else src="/favicon.png" alt="LDA" class="h-8 w-8" />
          </NuxtLink>
        </template>

        <template #default="{ collapsed }">
          <UNavigationMenu :collapsed="collapsed" :items="links[0]" orientation="vertical" tooltip />
        </template>
      </UDashboardSidebar>

      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <UDashboardNavbar class="border-b border-(--ui-border)">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>

          <div class="flex flex-1 items-center justify-center">
            <PortalCaseSearch />
          </div>

          <template #right>
            <div class="flex items-center gap-4">
              <UAvatar :alt="user?.name || 'User'" size="sm" />
              <div class="hidden min-w-0 sm:block">
                <div class="max-w-40 truncate text-sm leading-tight font-medium">{{ user?.name || 'User' }}</div>
                <div class="text-xs leading-tight text-muted">{{ role }}</div>
              </div>
              <UButton icon="i-ri-logout-box-r-line" variant="soft" size="sm" color="error" @click="logout" />
            </div>
          </template>
        </UDashboardNavbar>

        <NuxtLoadingIndicator
          color="repeating-linear-gradient(to right, var(--ui-primary) 0%, var(--ui-primary) 100%)"
        />
        <NuxtPage class="min-h-0 flex-1 overflow-auto" />
      </div>
    </UDashboardGroup>
  </UApp>
</template>
