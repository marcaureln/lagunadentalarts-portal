<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
    <div class="mx-auto max-w-2xl text-center">
      <div class="mb-8">
        <div class="animate-bounce text-8xl">🦷</div>
      </div>

      <div class="mb-6">
        <h1 class="mb-2 text-6xl font-light text-gray-900">{{ error.statusCode }}</h1>
        <div class="flex items-center justify-center gap-2 text-xl text-gray-600">
          <span>Oops! Something needs attention</span>
        </div>
      </div>

      <div class="mb-8">
        <p class="mb-4 text-lg text-gray-600">
          {{ getErrorMessage(error.statusCode) }}
        </p>
        <p class="text-gray-500">Don't worry, our dental experts are on it!</p>
      </div>

      <div class="flex flex-col justify-center gap-4 sm:flex-row">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 rounded-full bg-blue-700 px-8 py-4 text-white transition-colors hover:bg-blue-800"
        >
          <Icon name="ri:home-line" class="h-5 w-5" />
          Back to Home
        </NuxtLink>
      </div>

      <div class="mt-8 rounded-lg bg-blue-50 p-4">
        <p class="text-sm text-gray-600">
          <span class="font-medium">🦷 Dental Fact:</span>
          {{ getRandomDentalFact() }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps<{
  error: NuxtError;
}>();

const getErrorMessage = (statusCode: number) => {
  switch (statusCode) {
    case 404:
      return 'This page seems to have gone missing, like a tooth that needs replacing! 🦷';
    case 500:
      return "Our lab equipment needs a quick calibration. We'll have this fixed shortly! ⚙️";
    case 403:
      return 'Access to this area is restricted, like our sterile lab environment! 🔒';
    case 429:
      return "Whoa there! You're clicking faster than our high-speed handpiece! 🏃‍♂️";
    default:
      return 'Something unexpected happened in our digital lab. Let us fix this right up! 🔧';
  }
};

const getRandomDentalFact = () => {
  const facts = [
    'Tooth enamel is the hardest substance in the human body!',
    'A single tooth can withstand forces of up to 200 pounds.',
    'Dental impressions can capture details as small as 20 microns.',
    'The average person produces 25,000 quarts of saliva in their lifetime.',
    'Your tongue print is as unique as your fingerprint!',
    "Teeth start forming before you're even born.",
    'Ancient Egyptians used crushed eggshells as toothpaste.',
    'A smile uses 17 muscles, while a frown uses 43.',
  ];

  return facts[Math.floor(Math.random() * facts.length)];
};

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.',
});
</script>
