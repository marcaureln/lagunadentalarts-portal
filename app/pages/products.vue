<template>
  <div>
    <ProductsHero :title="data?.hero?.title || 'Products'" :description="data?.hero?.description || ''" />
    <ProductsGrid :products="data?.products || []" />
  </div>
</template>

<script setup lang="ts">
// SEO
useSeoMeta({
  title: 'Products',
  description:
    'Our crown and bridge solutions are designed digitally and milled for the best fit, while the finishing touches are added by hand.',
});

// Fetch products data
const { data } = await useAsyncData('products', () => queryCollection('products').first());
</script>
