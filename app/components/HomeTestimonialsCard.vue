<template>
  <div class="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6">
    <Icon name="ri:double-quotes-l" class="mb-3 text-blue-700" size="50px" />
    <p class="mb-9 flex-1 leading-6 text-gray-700">{{ text }}</p>
    <div class="flex items-center gap-3">
      <NuxtImg :src="photo" :alt="`Photo of ${name}`" class="aspect-square h-16 rounded-full" />
      <div>
        <div class="font-medium text-gray-900">{{ name }}</div>
        <div class="text-gray-500">{{ org }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ name: string; org: string; text: string; photo: string }>();
</script>
