<template>
  <div class="flex flex-col">
    <NuxtImg :src="photo" width="300" height="500" class="mb-3 rounded-xl" alt="Team Member Photo" />
    <div class="flex justify-between">
      <div class="">
        <div class="text-lg text-gray-900">{{ name }}</div>
        <div class="text-sm text-gray-500">{{ role }}</div>
      </div>

      <NuxtLink
        v-if="linkedIn"
        :to="linkedIn"
        class="text-gray-500 transition hover:text-blue-700"
        aria-label="LinkedIn Profile"
      >
        <Icon name="ri:linkedin-fill" size="20px" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TeamMember } from '~~/content.config';

defineProps<TeamMember>();
</script>
