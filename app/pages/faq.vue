<template>
  <main>
    <FaqHero />
    <FaqContent :categories="faqData?.categories ?? []" />
    <FaqCTA />
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: 'Frequently Asked Questions',
  description:
    'Find answers to common questions about our dental laboratory services, turnaround times, digital workflow, and more.',
});

const { data: faqData } = await useAsyncData('faq', () => queryCollection('faq').first());
</script>
