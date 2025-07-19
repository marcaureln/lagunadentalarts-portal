<template>
  <main>
    <AboutHero />
    <AboutWhatSetsUsApart />
    <AboutCommitment />
    <AboutTeam :team="team?.team ?? []" />
    <AboutCTA />
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: 'About Us',
  description:
    'Learn about our precision-driven, relationship-focused, patient-inspired approach to dental laboratory services.',
});

const { data: team } = await useAsyncData('team-about', () => queryCollection('team').first());
</script>
