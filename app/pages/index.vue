<template>
  <main>
    <HomeHero />
    <HomeAbout :featured-numbers="index?.featuredNumbers ?? []" />
    <HomeProducts />
    <HomeTeam
      v-if="teamData && !teamData.team.length"
      :team="teamData.team.filter((member: any) => member.showOnHome)"
    />
    <HomeTestimonials :testimonials="index?.testimonials ?? []" />
    <HomeCTA />
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: 'Your Trusted Dental Lab',
});

const { data: index } = await useAsyncData('index', () => queryCollection('index').first());
const { data: teamData } = await useAsyncData('team', () => queryCollection('team').first());
</script>
