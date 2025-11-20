<script setup lang="ts">
const { user } = useUserSession()
const userData = computed(() => user.value as any)
const role = computed(() => userData.value?.role)

definePageMeta({
  layout: 'portal',
})
</script>

<template>
  <div>
    <div class="py-10">
      <header>
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>
      </header>
      <main>
        <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div class="px-4 py-8 sm:px-0">
            <div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                  <div class="font-medium">{{ userData?.name }}</div>
                </h3>
                <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                  Welcome back, {{ userData?.name }}!
                </h3>
                <div class="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                  <p>You are logged in as <strong>{{ userData?.email }}</strong>.</p>
                  <p class="mt-1">Your role is: <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/30">{{ role }}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
