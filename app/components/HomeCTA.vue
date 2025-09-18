<template>
  <section class="bg-white py-12">
    <div class="container mx-auto flex flex-col items-center gap-9 px-4 md:flex-row md:px-8">
      <div class="flex-1 md:mb-0">
        <h2 class="mb-9 max-w-4xl text-2xl font-light text-gray-900 md:text-5xl">Ready to Start Your Next Case?</h2>
        <p class="mb-6 text-gray-500">
          Whether you’re sending your first case or need help with a rush request, we’re here to make the process smooth
          from day one.
        </p>
        <NuxtLink
          to="/digital-upload"
          class="flex items-center justify-between gap-3 rounded-full bg-blue-700 p-3 pl-6 text-lg text-white transition-colors duration-300 hover:bg-white hover:text-blue-700"
        >
          Let’s get started
          <div class="flex items-center justify-center rounded-full bg-white p-3 text-blue-700">
            <Icon name="ri:arrow-right-line" size="24px" />
          </div>
        </NuxtLink>
      </div>
      <div class="flex flex-1 flex-col items-center">
        <div class="relative flex w-full max-w-lg flex-col items-center overflow-hidden rounded-2xl">
          <NuxtImg src="/home-about.webp" alt="Dental Lab" class="aspect-square w-full object-cover" />
          <NuxtLink
            to="/digital-upload"
            class="absolute bottom-6 rounded-full bg-white px-6 py-3 text-blue-700 transition-colors hover:bg-blue-50"
          >
            Send a Case
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts"></script>
