<template>
  <section class="relative flex min-h-[80vh] items-center justify-center">
    <!-- Background Image -->
    <div class="absolute inset-0 z-0">
      <NuxtImg
        src="/dental-lab-large.webp"
        alt="Laguna Dental Arts building exterior"
        class="h-full w-full object-cover"
        loading="eager"
      />
      <div class="absolute inset-0 bg-gradient-to-br from-gray-950/20 to-gray-950/75"></div>
    </div>

    <div class="container relative z-10 mx-auto px-4 md:px-8">
      <!-- Hero Content -->
      <div class="mx-auto max-w-4xl text-center">
        <h1 class="mb-9 text-3xl font-bold text-white md:text-5xl">Premium Crown & Bridge Restorations</h1>
        <p class="mb-9 text-lg font-thin text-blue-50 md:text-xl">
          Trusted by leading dentists for precision, aesthetics, and reliability.
        </p>
        <NuxtLink
          to="#quote"
          class="inline-block rounded-full bg-white px-8 py-4 text-lg font-semibold text-blue-900 transition-colors hover:bg-blue-50"
        >
          Get a Free Case Pickup
        </NuxtLink>
      </div>
    </div>

    <!-- Certification Badges -->
    <div class="absolute bottom-6 flex flex-wrap items-center justify-center gap-3 opacity-90 md:gap-12">
      <div v-for="badge in badges" :key="badge.label" class="flex items-center gap-2">
        <Icon :name="badge.icon" class="text-4xl text-white md:text-6xl" />
        <span class="text-sm text-white md:text-lg">{{ badge.label }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Badge {
  icon: string;
  label: string;
}

const badges: Badge[] = [
  { icon: 'ri:shield-check-line', label: 'ADA Compliant' },
  { icon: 'ri:award-line', label: 'ISO 9001:2015 Certified' },
  { icon: 'ri:government-line', label: 'FDA Approved' },
];
</script>
