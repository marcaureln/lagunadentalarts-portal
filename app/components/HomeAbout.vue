<template>
  <section class="bg-white py-12">
    <div class="container mx-auto px-4 md:px-8">
      <h2 class="mb-2 text-lg font-semibold uppercase text-blue-700">About Company</h2>
      <h3 class="mb-16 max-w-4xl text-2xl font-light text-gray-900 md:text-5xl">
        What happens when you bring together a team of passionate experts who put their patients first and strive for
        success?
      </h3>

      <div class="mb-8 flex flex-col items-center gap-8 md:flex-row">
        <NuxtImg
          src="/home-about.webp"
          alt="Jonathan Borba Yui on Unsplash"
          width="500"
          height="500"
          class="rounded-4xl"
        />
        <div class="mx-auto max-w-lg flex-1">
          <h4 class="mb-3 text-4xl font-semibold text-gray-900">
            Trusted by Dentists.<br />
            Built on Precision.
          </h4>
          <p class="mb-9 text-gray-600">
            At Laguna Dental Arts, we combine precision craftsmanship with responsive service to support dental
            practices across California. From single crowns to full restorations, our experienced team delivers
            consistent quality, fast turnarounds, and seamless digital integration—always with a focus on care and
            communication.
          </p>
          <button class="rounded-4xl bg-blue-700 px-6 py-3 text-white hover:bg-blue-800">Learn More</button>
        </div>
      </div>

      <div class="flex flex-col gap-16 md:flex-row">
        <div v-for="(number, idx) of featuredNumbers" :key="`featuredNumber-${idx}`" class="flex items-center gap-9">
          <div class="text-4xl font-medium text-blue-700">{{ number.value }}</div>
          <div class="text-xl text-gray-600">{{ number.label }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  featuredNumbers?: {
    value: number;
    label: string;
  }[];
}>();
</script>
