<template>
  <main>
    <CareersHero />
    <CareersJobs :jobs="activeJobs" />
    <CareersCTA />
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: 'Careers',
  description:
    "Join the Laguna Dental Arts team. We're looking for passionate dental professionals to help us deliver exceptional dental laboratory services.",
});

const { data: careers } = await useAsyncData('careers-jobs', () => queryCollection('careers').first());

const activeJobs = computed(() => {
  if (!careers.value?.jobs) return [];

  const now = new Date();
  return careers.value.jobs.filter((job) => {
    const expirationDate = new Date(job.expiresAt);
    return expirationDate > now;
  });
});
</script>
