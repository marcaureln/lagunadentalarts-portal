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
const testimonials = [
  {
    name: 'Dr. Monica Lee',
    photo: 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/56.jpg',
    org: 'Prosthodontics, Brightview Dental Group',
    text: 'Laguna Dental Arts has completely transformed our workflow. Their turnaround time is reliable, and the consistency in quality gives us complete confidence in every restoration.',
  },
  {
    name: 'Dr. James Keller',
    photo: 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/56.jpg',
    org: 'Owner, Sweet Crest Family Dental',
    text: 'From day one, their team has gone above and beyond. Whether it’s a routine crown or a last-minute rush case, I know I can count on them every time.',
  },
  {
    name: 'Dr. Priya Mehta',
    photo: 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/56.jpg',
    org: 'Laguna Dental, Coastal Smiles Dental Studio',
    text: 'What really stands out is their customer service. The communication is clear, the support is personal, and the results are always top-tier.',
  },
  {
    name: 'Dr. Evan Ranier',
    photo: 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/56.jpg',
    org: 'Partner, Crestview Dental Partners',
    text: 'Working with Laguna Dental Arts has been a game changer. Their attention to detail and personalized approach are what set them apart from the local or overseas labs our team has tried in the past.',
  },
];
</script>
