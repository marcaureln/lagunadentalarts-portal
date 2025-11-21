<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const error = computed(() => route.query.error)

const errorMessage = computed(() => {
  switch (error.value) {
    case 'AccessDenied':
      return 'You are not authorized to access this portal. Please contact an administrator.'
    case 'OAuthError':
      return 'An error occurred during sign in. Please try again.'
    case 'MissingEmail':
      return 'Unable to determine your email from Microsoft login. Please contact support.'
    default:
      return 'An error occurred during sign in. Please try again.'
  }
})
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
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          title="Access Denied"
          :description="errorMessage"
          icon="i-ri-error-warning-line"
        />

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
          <UButton
            to="/auth/microsoft"
            color="primary"
            size="lg"
            block
            icon="i-ri-microsoft-fill"
            :external="true"
          >
            Sign in with Microsoft
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
