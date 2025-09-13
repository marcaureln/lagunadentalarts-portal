<template>
  <main>
    <HomeHero />
    <HomeAbout :featured-numbers="index?.featuredNumbers ?? []" />
    <HomeProducts />
    <HomeTeam v-if="showcasedTeamMembers.length > 0" :team="showcasedTeamMembers" />
    <HomeTestimonials v-if="index?.testimonials && index.testimonials.length > 0" :testimonials="index.testimonials" />
    <HomeCTA />
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: 'Your Trusted Dental Lab',
});

const { data: index } = await useAsyncData('index', () => queryCollection('index').first());
const { data: teamCollection } = await useAsyncData('team', () => queryCollection('team').first());

const showcasedTeamMembers = computed(() => {
  if (!teamCollection.value?.team) return [];

  return teamCollection.value.team.filter((member) => member.showOnHome);
});
</script>
