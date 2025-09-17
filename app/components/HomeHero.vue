<template>
  <section class="py-12">
    <div
      class="container mx-auto flex flex-col items-center justify-around gap-9 rounded-xl bg-gray-50 p-12 px-4 md:flex-row md:px-8"
    >
      <NuxtImg
        src="/dental-lab.jpg"
        alt="Laguna Dental Arts Building"
        height="500"
        width="500"
        class="rounded-xl object-cover"
      />
      <div class="max-w-xl flex-1">
        <h1 class="mb-4 text-3xl font-thin text-gray-900 md:text-7xl">A Lab That Works Like Part of Your Practice.</h1>
        <p class="mb-12 font-light text-gray-800">
          We’re here to make your work easier—with responsive support and exceptional results, every time.
        </p>
        <NuxtLink to="/products" class="rounded-4xl bg-blue-700 px-6 py-3 text-white hover:bg-blue-800">
          See what we do
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts"></script>
