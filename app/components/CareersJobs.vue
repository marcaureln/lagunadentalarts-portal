<template>
  <section class="bg-gray-50 py-16 md:py-24">
    <div class="container mx-auto px-4 md:px-8">
      <div class="mb-12 text-center">
        <h2 class="mb-4 text-3xl font-light text-gray-900 md:text-5xl">Open Positions</h2>
        <p class="mx-auto max-w-3xl leading-relaxed text-gray-600">
          We're always looking for passionate, detail-driven professionals to join the Laguna Dental Arts family.
          Whether you're a seasoned dental technician, a customer care expert, or new to the industry and eager to grow,
          we'd love to hear from you.
        </p>
      </div>

      <div class="space-y-6">
        <div
          v-for="(job, index) in jobs"
          :key="`job-${index}`"
          class="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6"
        >
          <div class="flex-1">
            <div class="mb-2 flex items-center gap-4">
              <span class="text-sm font-medium uppercase tracking-wide text-blue-600">{{ job.department }}</span>
            </div>
            <h3 class="mb-3 text-xl font-semibold text-gray-900">{{ job.title }}</h3>
            <div class="flex items-center gap-6 text-sm text-gray-600">
              <div class="flex items-center gap-2">
                <Icon name="ri:map-pin-line" class="h-4 w-4" />
                <span>{{ job.location }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="ri:time-line" class="h-4 w-4" />
                <span>{{ job.type }}</span>
              </div>
            </div>
          </div>
          <div class="ml-6">
            <NuxtLink
              :to="`mailto:careers@lagunadentalarts.com?subject=Application for ${job.title} Position&body=Dear Hiring Team,%0A%0AI am interested in the ${job.title} position in the ${job.department} department. Please find my resume attached.%0A%0AThank you for your consideration.%0A%0ABest regards,`"
              class="inline-flex items-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-800"
              external
            >
              Apply Now
              <Icon name="ri:mail-line" class="h-4 w-4" />
            </NuxtLink>
          </div>
        </div>
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
