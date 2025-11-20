<script setup lang="ts">
const { user } = useUserSession()
const role = computed(() => (user.value as any)?.role)

const links = computed(() => [
  {
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/portal'
  },
  ...(role.value === 'ADMIN' ? [{
    label: 'Users',
    icon: 'i-heroicons-users',
    to: '/portal/admin/users'
  }] : [])
])

async function logout() {
  await navigateTo('/auth/logout', { external: true })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <UContainer class="flex items-center justify-between h-16">
        <div class="flex items-center gap-4">
          <NuxtLink to="/portal" class="font-bold text-xl">Portal</NuxtLink>
          <UHorizontalNavigation :links="links" />
        </div>
        
        <div class="flex items-center gap-4">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ (user as any)?.name }} ({{ role }})
          </div>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-arrow-right-on-rectangle"
            @click="logout"
          >
            Logout
          </UButton>
        </div>
      </UContainer>
    </header>

    <main class="p-4">
      <UContainer>
        <slot />
      </UContainer>
    </main>
  </div>
</template>
