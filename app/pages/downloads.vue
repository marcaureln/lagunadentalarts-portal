<template>
  <main class="pb-16">
    <section class="container mx-auto px-4 pt-12 md:px-8">
      <h1 class="mb-4 text-4xl font-medium text-gray-900 md:text-6xl">Downloads & Resources</h1>
      <p class="mb-10 max-w-2xl text-lg text-gray-500">
        As a convenient tool, we’ve uploaded some of our most requested resources and forms from Laguna Dental Arts
        here. Please feel free to download these and use to send with your next case, prep your patient, or refer to for
        product details.
      </p>
      <div class="mb-12 flex flex-col gap-6 md:flex-row md:gap-8">
        <div v-for="file in downloads?.files" :key="file.title" class="flex-1">
          <NuxtLink
            :to="file.link"
            class="block rounded-xl border border-gray-300 bg-white px-8 py-8 text-center transition hover:border-blue-700"
            external
          >
            <div class="mb-2 text-lg font-bold text-gray-900">{{ file.title }}</div>
            <div class="text-sm text-gray-500">Download</div>
          </NuxtLink>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <div class="mb-1 font-semibold text-gray-900">Shipping Label</div>
          <div class="text-gray-600">
            For a shipping label call
            <a href="tel:19166881333" class="text-gray-500 underline hover:text-blue-700">(916) 688-1333</a>
          </div>
        </div>
        <div>
          <div class="mb-1 font-semibold text-gray-900">Prep Guide</div>
          <div class="text-gray-600">
            For a prep guide call
            <a href="tel:19166881333" class="text-gray-500 underline hover:text-blue-700">(916) 688-1333</a>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
const { data: downloads } = await useAsyncData('downloads', () => queryCollection('downloads').first());
</script>
