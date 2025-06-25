<template>
  <div
    class="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 transition hover:ring-1 hover:ring-blue-700"
  >
    <h4 class="text-xl font-medium text-gray-900">{{ title }}</h4>
    <p class="flex-1 text-sm text-gray-600">{{ desc }}</p>
    <NuxtLink
      to="#"
      class="mt-3 flex h-fit w-fit items-center justify-center rounded-full border-[1px] border-blue-700 text-blue-700 transition hover:bg-blue-700 hover:text-white"
      aria-label="Learn more about {{ title }}"
    >
      <Icon name="i-ph-arrow-up-right" size="16px" class="m-3" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; desc: string }>();
</script>
