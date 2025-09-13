<template>
  <main>
    <AboutHero />
    <AboutWhatSetsUsApart />
    <AboutCommitment />
    <AboutTeam v-if="teamCollection?.team && teamCollection.team.length > 0" :team="teamCollection.team" />
    <AboutCTA />
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: 'About Us',
  description:
    'Learn about our precision-driven, relationship-focused, patient-inspired approach to dental laboratory services.',
});

const { data: teamCollection } = await useAsyncData('team', () => queryCollection('team').first());
</script>
