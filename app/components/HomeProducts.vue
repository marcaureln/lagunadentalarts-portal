<template>
  <section class="md:py-12">
    <div class="container mx-auto px-4 md:px-8">
      <h2 class="mb-2 text-lg font-semibold uppercase text-blue-700">Our Products</h2>
      <h3 class="mb-16 max-w-4xl text-2xl font-light text-gray-900 md:text-5xl">
        Built for Accuracy and Patient Satisfaction.
      </h3>
      <div class="grid grid-cols-1 gap-9 md:grid-cols-3">
        <HomeProductsCard
          v-for="product in data?.products || []"
          :key="product.title"
          :title="product.title"
          :desc="product.desc"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { data } = await useAsyncData('products', () => queryCollection('products').first());
</script>
