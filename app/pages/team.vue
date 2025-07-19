<template>
  <main>
    <TeamHero />
    <TeamMembers :team="team?.team ?? []" />
    <TeamCareers :jobs="activeJobs" />
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: 'Our Team',
  description:
    'Meet the expert team behind Laguna Dental Arts and discover career opportunities to join our growing company.',
});

const { data: team } = await useAsyncData('team-page', () => queryCollection('team').first());
const { data: careers } = await useAsyncData('careers-preview', () => queryCollection('careers').first());

const activeJobs = computed(() => {
  if (!careers.value?.jobs) return [];

  const now = new Date();
  return careers.value.jobs
    .filter((job) => {
      const expirationDate = new Date(job.expiresAt);
      return expirationDate > now;
    })
    .slice(0, 3);
});
</script>
