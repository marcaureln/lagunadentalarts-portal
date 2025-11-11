<template>
  <section class="bg-white py-16 md:py-24">
    <div class="container mx-auto px-4 md:px-8">
      <div class="mb-12 text-center">
        <h2 class="mb-4 text-3xl font-light text-gray-900 md:text-5xl">Meet the Team</h2>
        <p class="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600">
          Our success starts with people. Get to know the expert technicians, account reps, and support staff behind
          Laguna Dental Arts—each one committed to helping your practice thrive.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="(member, idx) in team" :key="`team-member-${idx}`" class="text-center">
          <NuxtImg
            :src="member.photo"
            :alt="member.name"
            width="300"
            height="300"
            class="mx-auto mb-4 h-80 w-auto rounded-lg bg-gray-200 md:object-cover"
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
import type { TeamMember } from '~~/content.config';

defineProps<{
  team?: TeamMember[];
}>();
</script>
