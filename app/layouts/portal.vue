<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import { getRoleLabel } from '~~/shared/utils/users';
import { routes } from '~~/shared/config/routes';

const { user } = useUserSession();
const role = computed(() => getRoleLabel(user.value?.role));

const open = ref(false);

const links = computed(() => {
  const accessibleRoutes = routes.getAccessibleRoutes(user.value?.role);

  // Separate home from admin routes
  const homeRoute = accessibleRoutes.find((r) => r.href === '/portal');
  const adminRoutes = accessibleRoutes.filter((r) => r.href !== '/portal' && r.href.startsWith('/portal/admin'));
  const otherRoutes = accessibleRoutes.filter((r) => r.href !== '/portal' && !r.href.startsWith('/portal/admin'));

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
          <NuxtLink to="/portal" class="mx-auto">
            <img v-if="!collapsed" src="/logo.png" alt="Laguna Dental Arts" class="h-14" />
            <img v-else src="/favicon.png" alt="LDA" class="h-8 w-8" />
          </NuxtLink>
        </template>

        <template #default="{ collapsed }">
          <UNavigationMenu :collapsed="collapsed" :items="links[0]" orientation="vertical" tooltip />
        </template>

        <template #footer="{ collapsed }">
          <UDropdownMenu
            :items="[
              [
                {
                  label: user?.name || 'User',
                  slot: 'account',
                  disabled: true,
                },
              ],
              [
                {
                  label: 'Logout',
                  icon: 'i-ri-logout-box-r-line',
                  onSelect: logout,
                },
              ],
            ]"
            :popper="{ strategy: 'absolute', placement: 'top' }"
          >
            <template #account>
              <div class="flex items-center gap-2 text-left">
                <div
                  class="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full font-semibold"
                >
                  {{ (user?.name || 'U').charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 truncate text-sm">
                  <div class="text-foreground font-medium">{{ user?.name || 'User' }}</div>
                  <div class="text-muted">{{ role }}</div>
                </div>
              </div>
            </template>

            <UButton
              color="neutral"
              variant="ghost"
              class="w-full justify-start"
              :class="{ 'justify-center': collapsed }"
            >
              <UAvatar :alt="user?.name || 'User'" size="sm" />
              <div v-if="!collapsed" class="flex-1 truncate text-left text-sm">
                <div class="text-foreground font-medium">{{ user?.name || 'User' }}</div>
                <div class="text-muted">{{ role }}</div>
              </div>
            </UButton>
          </UDropdownMenu>
        </template>
      </UDashboardSidebar>

      <NuxtPage />
    </UDashboardGroup>
  </UApp>
</template>
