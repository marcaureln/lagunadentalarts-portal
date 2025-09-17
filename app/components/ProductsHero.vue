<template>
  <section class="bg-gray-50 py-20">
    <div class="container mx-auto px-4 text-center md:px-8">
      <h1 class="mb-6 text-4xl font-light text-gray-900 md:text-6xl">
        {{ title }}
      </h1>
      <p class="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
        {{ description }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  description: string;
}

defineProps<Props>();
</script>
