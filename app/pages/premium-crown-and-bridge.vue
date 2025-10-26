<template>
  <main>
    <TheNavbar
      :nav-links="[]"
      :actions="[{ to: '#quote', label: 'Send a Case', classes: 'bg-blue-700 text-white hover:bg-blue-800' }]"
    />
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
