<template>
  <section class="container mx-auto px-4 py-12 md:px-8">
    <div class="mb-16 grid grid-cols-2 items-end">
      <div>
        <h2 class="mb-2 text-lg font-semibold uppercase text-blue-700">Testimonials</h2>
        <h3 class="max-w-4xl text-2xl font-light text-gray-900 md:text-5xl">You're in Good Company</h3>
      </div>
      <p class="text-xl text-gray-500">
        Dentists across California trust Laguna Dental Arts to deliver quality, consistency, and support they can count
        on.
      </p>
    </div>
    <div>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-4">
        <HomeTestimonialsCard
          v-for="(testimonial, index) in testimonials"
          :key="`testimonial-${index}`"
          v-bind="testimonial"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  testimonials: {
    name: string;
    org: string;
    text: string;
    photo: string;
  }[];
}>();
</script>
