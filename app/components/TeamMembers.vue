<template>
  <section class="bg-gray-50 py-16 md:py-24">
    <div class="container mx-auto px-4 md:px-8">
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="(member, idx) in team" :key="`team-member-${idx}`" class="text-center">
          <NuxtImg
            :src="member.photo"
            :alt="member.name"
            width="300"
            height="300"
            class="mb-4 h-80 w-full rounded-lg bg-gray-200 object-cover"
          />
          <h3 class="mb-1 text-xl font-semibold text-gray-900">{{ member.name }}</h3>
          <p class="mb-3 text-gray-600">{{ member.role }}</p>
          <NuxtLink
            v-if="member.linkedIn"
            :to="member.linkedIn"
            external
            class="inline-flex items-center text-blue-600 transition-colors hover:text-blue-700"
          >
            <Icon name="ri:linkedin-line" class="h-5 w-5" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  team?: {
    name: string;
    role: string;
    photo: string;
    linkedIn?: string;
  }[];
}>();
</script>
