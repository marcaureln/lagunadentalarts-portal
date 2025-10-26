<template>
  <section class="bg-white py-20">
    <div class="container mx-auto px-4 md:px-8">
      <!-- Section Header -->
      <div class="mb-12 text-center">
        <h2 class="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Why Dentists Choose Us</h2>
        <p class="text-xl text-gray-600">Excellence in every restoration.</p>
      </div>

      <!-- Features Grid -->
      <div class="grid gap-9 md:grid-cols-3">
        <div v-for="feature in features" :key="feature.title" class="rounded-2xl p-3 text-center">
          <Icon :name="feature.icon" size="32px" class="mb-3 text-blue-700" />
          <h5 class="mb-1 text-xl font-bold text-gray-900">{{ feature.title }}</h5>
          <p class="text-gray-600">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    icon: 'ri:vip-diamond-line',
    title: 'High-Precision Fit',
    description: 'Digital and hand-crafted restorations for unmatched accuracy and patient comfort.',
  },
  {
    icon: 'ri:palette-line',
    title: 'Natural Aesthetics',
    description: 'Custom shading and contouring to ensure crowns and bridges blend seamlessly.',
  },
  {
    icon: 'ri:timer-line',
    title: 'Fast Turnaround',
    description: 'Reliable turnaround times with free case pickup and on-time delivery guaranteed.',
  },
];
</script>
