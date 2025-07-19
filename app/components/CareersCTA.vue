<template>
  <section class="bg-blue-700 py-16 md:py-24">
    <div class="container mx-auto px-4 md:px-8">
      <div class="text-center">
        <h2 class="mb-6 text-3xl font-light leading-tight text-white md:text-5xl">Ready to Join Our Team?</h2>
        <p class="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-blue-100">
          Don't see the perfect role? We're always interested in hearing from talented professionals. Send us your
          resume and let us know how you'd like to contribute to our mission.
        </p>
        <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <NuxtLink
            to="mailto:careers@lagunadentalarts.com"
            class="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-blue-700 transition-colors hover:bg-blue-50"
          >
            <Icon name="ri:mail-line" class="h-5 w-5" />
            Email Your Resume
          </NuxtLink>
          <NuxtLink
            to="/contact"
            class="inline-flex items-center gap-2 rounded-full border-2 border-white px-8 py-4 text-white transition-colors hover:bg-white hover:text-blue-700"
          >
            Contact Us
            <Icon name="ri:arrow-right-line" class="h-5 w-5" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts"></script>
