<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const error = computed(() => route.query.error)
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <!-- Logo placeholder or actual logo if available -->
        <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Laguna Dental Arts
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Sign in with your Microsoft work account to access the portal.
        </p>
      </div>

      <div v-if="error" class="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Access Denied</h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              <p v-if="error === 'AccessDenied'">
                You are not authorized to access this portal. Please contact an administrator.
              </p>
              <p v-else-if="error === 'OAuthError'">
                An error occurred during sign in. Please try again.
              </p>
              <p v-else>
                An error occurred during sign in. Please try again.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 space-y-6">
        <a
          href="/auth/microsoft"
          class="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <span class="absolute inset-y-0 left-0 flex items-center pl-3">
            <!-- Microsoft Icon -->
            <svg class="h-5 w-5 text-blue-500 group-hover:text-blue-400" viewBox="0 0 21 21" fill="currentColor">
              <path fill="#f25022" d="M1 1h9v9H1z" />
              <path fill="#00a4ef" d="M1 11h9v9H1z" />
              <path fill="#7fba00" d="M11 1h9v9H11z" />
              <path fill="#ffb900" d="M11 11h9v9H11z" />
            </svg>
          </span>
          Sign in with Microsoft
        </a>
      </div>
    </div>
  </div>
</template>
