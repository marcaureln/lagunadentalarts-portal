<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const error = computed(() => route.query.error)
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Left Side - Image -->
    <div class="hidden lg:flex lg:w-1/2 bg-gray-100 items-center justify-center">
      <img
        src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=1974&auto=format&fit=crop"
        alt="Dental professional at work"
        class="h-full w-full object-cover"
      >
    </div>

    <!-- Right Side - Login Form -->
    <div class="flex w-full lg:w-1/2 items-center justify-center px-6 py-12 bg-white">
      <div class="w-full max-w-md space-y-8">
        <!-- Logo -->
        <div class="flex justify-center">
          <img
            src="/logo.png"
            alt="Laguna Dental Arts"
            class="h-16 w-auto"
          >
        </div>

        <!-- Error Message -->
        <div v-if="error" class="rounded-lg bg-red-50 p-4 border border-red-200">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Access Denied</h3>
              <div class="mt-2 text-sm text-red-700">
                <p v-if="error === 'AccessDenied'">
                  You are not authorized to access this portal. Please contact an administrator.
                </p>
                <p v-else-if="error === 'OAuthError'">
                  An error occurred during sign in. Please try again.
                </p>
                <p v-else-if="error === 'MissingEmail'">
                  Unable to determine your email from Microsoft login. Please contact support.
                </p>
                <p v-else>
                  An error occurred during sign in. Please try again.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Login Form -->
        <div class="space-y-6">
          <div class="text-center">
            <h2 class="text-2xl font-semibold text-gray-900">
              Welcome Back
            </h2>
            <p class="mt-2 text-sm text-gray-600">
              Sign in with your Microsoft account to continue
            </p>
          </div>

          <!-- Microsoft SSO Button -->
          <a
            href="/auth/microsoft"
            class="flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <svg class="h-5 w-5" viewBox="0 0 21 21" fill="currentColor">
              <path fill="#ffffff" d="M1 1h9v9H1z" />
              <path fill="#ffffff" d="M1 11h9v9H1z" />
              <path fill="#ffffff" d="M11 1h9v9H11z" />
              <path fill="#ffffff" d="M11 11h9v9H11z" />
            </svg>
            Sign in with Microsoft
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
