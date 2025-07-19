<template>
  <section class="bg-gray-50 py-16 md:py-24">
    <div class="container mx-auto px-4 text-center md:px-8">
      <div class="mx-auto max-w-3xl">
        <h2 class="mb-6 text-3xl font-light text-gray-900 md:text-4xl">Still Have Questions?</h2>
        <p class="mb-8 text-lg leading-relaxed text-gray-600">
          Our team is here to help. Contact us directly for personalized assistance with your dental laboratory needs.
        </p>

        <div class="flex flex-col items-center justify-center gap-4 md:flex-row">
          <NuxtLink
            to="/contact"
            class="inline-flex items-center gap-2 rounded-full bg-blue-700 px-8 py-4 text-white transition-colors hover:bg-blue-800"
          >
            <Icon name="ri:message-3-line" class="h-5 w-5" />
            Contact Us
          </NuxtLink>

          <NuxtLink
            to="tel:+1234567890"
            class="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-4 text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Icon name="ri:phone-line" class="h-5 w-5" />
            Call Us Today
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts"></script>
