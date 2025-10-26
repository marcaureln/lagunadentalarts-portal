<template>
  <main>
    <LandingNavbar />
    <LandingHero />
    <LandingWhy />
    <LandingTestimonial />
    <LandingCaseStudy />
    <LandingContact />
    <TheFooter />
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: 'Premium Crown & Bridge Restorations',
  description: 'Trusted by leading dentists for precision, aesthetics, and reliability.',
});

definePageMeta({
  layout: false,
});
</script>
