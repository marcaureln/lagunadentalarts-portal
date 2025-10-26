<template>
  <header class="bg-white">
    <div class="container mx-auto flex items-center justify-between px-4 py-4 md:px-8">
      <NuxtLink to="/">
        <NuxtImg src="/logo.png" alt="Laguna Dental Arts Logo" height="75" />
      </NuxtLink>

      <!-- Desktop Buttons -->
      <div class="flex gap-3">
        <NuxtLink to="#quote" class="rounded-4xl bg-blue-700 px-4 py-2 font-normal text-white hover:bg-blue-800">
          Send a Case
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
