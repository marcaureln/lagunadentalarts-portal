<template>
  <section class="bg-white py-16 md:py-24">
    <div class="container mx-auto px-4 md:px-8">
      <div class="mb-12 text-center">
        <h2 class="mb-4 text-3xl font-light text-gray-900 md:text-5xl">Join Our Team</h2>
        <p class="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600">
          We're always looking for talented individuals to join our growing team. Discover opportunities to advance your
          career in the dental laboratory industry.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div
          v-for="(job, index) in jobs"
          :key="`career-${index}`"
          class="rounded-lg border border-gray-200 bg-white p-6"
        >
          <div class="mb-4">
            <h3 class="mb-2 text-xl font-semibold text-gray-900">{{ job.title }}</h3>
            <div class="flex flex-wrap gap-2 text-sm text-gray-600">
              <span class="rounded-full bg-blue-100 px-3 py-1 text-blue-700">{{ job.department }}</span>
              <span class="rounded-full bg-gray-100 px-3 py-1">{{ job.location }}</span>
              <span class="rounded-full bg-green-100 px-3 py-1 text-green-700">{{ job.type }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <NuxtLink
              :to="`mailto:careers@lagunadentalarts.com?subject=Application for ${job.title} Position&body=Dear Hiring Team,%0A%0AI am interested in the ${job.title} position in the ${job.department} department. Please find my resume attached.%0A%0AThank you for your consideration.%0A%0ABest regards,`"
              external
              class="font-medium text-blue-600 hover:text-blue-700"
            >
              Apply Now →
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="mt-12 text-center">
        <NuxtLink
          to="/careers"
          class="inline-flex items-center gap-2 rounded-full bg-blue-700 px-8 py-4 text-white transition-colors hover:bg-blue-800"
        >
          View All Positions
          <Icon name="ri:arrow-right-line" class="h-5 w-5" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  jobs?: {
    title: string;
    department: string;
    location: string;
    type: string;
    expiresAt: string;
  }[];
}>();
</script>
