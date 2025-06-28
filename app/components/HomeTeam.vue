<template>
  <section class="bg-white py-12">
    <div class="container mx-auto px-4 md:px-8">
      <h2 class="mb-2 text-lg font-semibold uppercase text-blue-700">Our Team</h2>
      <h3 class="mb-16 max-w-4xl text-2xl font-light text-gray-900 md:text-5xl">
        We’re More Than a Lab—We’re Your Team
      </h3>
      <div class="grid grid-cols-2 gap-9 md:grid-cols-4">
        <HomeTeamCard v-for="member in team" :key="member.name" v-bind="member" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  team: {
    name: string;
    role: string;
    linkedIn: string;
    photo: string;
  }[];
}>();
</script>
