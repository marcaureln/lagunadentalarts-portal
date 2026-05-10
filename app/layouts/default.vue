<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import { getRoleLabel } from '~~/shared/utils/users';
import { routes } from '~~/shared/config/routes';

const { user } = useUserSession();
const role = computed(() => getRoleLabel(user.value?.role));

const open = ref(false);

const links = computed(() => {
  const accessibleRoutes = routes.getAccessibleRoutes(user.value?.role);

  const homeRoute = accessibleRoutes.find((r) => r.href === '/');
  const adminRoutes = accessibleRoutes.filter((r) => r.href.startsWith('/admin'));
  const otherRoutes = accessibleRoutes.filter((r) => r.href !== '/' && !r.href.startsWith('/admin'));

  const items: NavigationMenuItem[] = [];

  // Add home
  if (homeRoute) {
    items.push({
      label: homeRoute.name,
      icon: homeRoute.icon,
      to: homeRoute.href,
      onSelect: () => {
        open.value = false;
      },
    });
  }

  // Add other routes
  otherRoutes.forEach((route) => {
    items.push({
      label: route.name,
      icon: route.icon,
      to: route.href,
      onSelect: () => {
        open.value = false;
      },
    });
  });

  // Add administration group if there are admin routes
  if (adminRoutes.length > 0) {
    items.push({
      label: 'Administration',
      icon: 'i-ri-settings-3-line',
      children: adminRoutes.map((route) => ({
        label: route.name,
        icon: route.icon,
        to: route.href,
        onSelect: () => {
          open.value = false;
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
      <UDashboardSidebar id="portal" v-model:open="open" collapsible resizable>
        <template #header="{ collapsed }">
          <NuxtLink to="/" class="mx-auto">
            <img v-if="!collapsed" src="/logo.png" alt="Laguna Dental Arts" class="h-14" />
            <img v-else src="/favicon.png" alt="LDA" class="h-8 w-8" />
          </NuxtLink>
        </template>

        <template #default="{ collapsed }">
          <UNavigationMenu :collapsed="collapsed" :items="links[0]" orientation="vertical" tooltip />
        </template>

        <template #footer="{ collapsed }">
          <div class="flex w-full flex-col gap-2 pb-2">
            <div class="flex w-full items-center gap-2 px-2" :class="{ 'justify-center': collapsed }">
              <UAvatar :alt="user?.name || 'User'" size="sm" />
              <div v-if="!collapsed" class="flex-1 truncate text-left text-sm">
                <div class="text-foreground font-medium">{{ user?.name || 'User' }}</div>
                <div class="text-muted">{{ role }}</div>
              </div>
            </div>

            <UButton
              color="error"
              variant="soft"
              icon="i-ri-logout-box-r-line"
              block
              :class="{ 'justify-center': collapsed, 'justify-start': !collapsed }"
              :label="collapsed ? undefined : 'Logout'"
              @click="logout"
            />
          </div>
        </template>
      </UDashboardSidebar>

      <NuxtLoadingIndicator color="repeating-linear-gradient(to right, var(--ui-primary) 0%, var(--ui-primary) 100%)" />
      <NuxtPage />
    </UDashboardGroup>
  </UApp>
</template>
