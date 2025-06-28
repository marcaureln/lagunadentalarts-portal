<template>
  <main>
    <HomeHero />
    <HomeAbout :featured-numbers="index?.featuredNumbers ?? []" />
    <HomeProducts />
    <HomeTeam :team="team?.team?.slice(0, 4) ?? []" />
    <HomeTestimonials :testimonials="index?.testimonials ?? []" />
    <HomeCTA />
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: 'Your Trusted Dental Lab',
});

const { data: index } = await useAsyncData('index', () => queryCollection('index').first());
const { data: team } = await useAsyncData('team', () => queryCollection('team').first());
</script>
