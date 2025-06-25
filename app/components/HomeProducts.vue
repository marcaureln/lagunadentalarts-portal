<template>
  <section class="py-12">
    <div class="container mx-auto px-4 md:px-8">
      <h2 class="mb-2 text-lg font-semibold uppercase text-blue-700">Our Products</h2>
      <h3 class="mb-16 max-w-4xl text-2xl font-light text-gray-900 md:text-5xl">
        Built for Accuracy and Patient Satisfaction.
      </h3>
      <div class="grid grid-cols-1 gap-9 md:grid-cols-3">
        <HomeProductsCard
          v-for="product in products"
          :key="product.title"
          :title="product.title"
          :desc="product.desc"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const products = [
  {
    title: 'Crown & Bridges',
    desc: 'From full-contour to highly esthetic work and Zirconia, our team delivers beautiful, strong, and consistent results.',
  },
  {
    title: 'Implant Support',
    desc: 'Precise implant analogs and confidence back to your cases, including custom abutments and digital workflows.',
  },
  {
    title: 'Removeables',
    desc: 'From partials to dentures and flexible options, our lab balances esthetics and function for every patient.',
  },
  {
    title: 'Surgical Guides',
    desc: 'We design and fabricate guides for predictable, accurate implant placement and restorative success.',
  },
  {
    title: 'Orthodontics',
    desc: 'Clear aligners, retainers, and appliances for every age—customized for comfort and compliance.',
  },
  {
    title: 'Chair Side Conversations',
    desc: 'We support your team with digital case planning, communication, and education for better patient outcomes.',
  },
];
</script>
