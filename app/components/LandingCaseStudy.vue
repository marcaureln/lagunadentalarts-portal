<template>
  <section class="bg-gray-50 py-20">
    <div class="container mx-auto px-4 md:px-8">
      <!-- Section Header -->
      <div class="mb-12 text-center">
        <h2 class="mb-4 text-3xl font-bold text-gray-900 md:text-5xl">Case Study: Restoring a Natural Smile</h2>
        <p class="text-xl text-gray-600">
          A look at how our team delivered precision and aesthetics for a complex bridge case.
        </p>
      </div>

      <!-- Case Study Content -->
      <div class="mx-auto max-w-5xl">
        <!-- Before/After Image Placeholder -->
        <div class="mb-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 p-12">
          <div class="flex items-center justify-center gap-8">
            <div class="flex flex-col items-center">
              <div class="mb-4 flex h-48 w-48 items-center justify-center rounded-full bg-white">
                <Icon name="ri:image-line" size="64px" class="text-gray-400" />
              </div>
              <span class="text-sm font-semibold uppercase tracking-wide text-gray-600">Before</span>
            </div>
            <Icon name="ri:arrow-right-line" size="32px" class="text-blue-700" />
            <div class="flex flex-col items-center">
              <div class="mb-4 flex h-48 w-48 items-center justify-center rounded-full bg-white">
                <Icon name="ri:image-line" size="64px" class="text-gray-400" />
              </div>
              <span class="text-sm font-semibold uppercase tracking-wide text-gray-600">After</span>
            </div>
          </div>
          <div class="mt-6 text-center">
            <span class="inline-block rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
              Crown & Bridge
            </span>
          </div>
        </div>

        <!-- Case Details -->
        <div class="grid gap-8 md:grid-cols-3">
          <!-- Challenge -->
          <div>
            <h5 class="mb-3 text-xl font-bold text-gray-900">Challenge</h5>
            <p class="text-gray-600">
              The patient presented with worn and mismatched anterior crowns. The dentist needed a partner who could
              restore a harmonious, natural smile with durable materials and perfect shade matching.
            </p>
          </div>

          <!-- Solution -->
          <div>
            <h5 class="mb-3 text-xl font-bold text-gray-900">Solution</h5>
            <p class="text-gray-600">
              Using digital scans and layered zirconia, our technicians handcrafted a 4-unit bridge with lifelike
              translucency and precise margins. Turnaround time was under 5 business days.
            </p>
          </div>

          <!-- Result -->
          <div>
            <h5 class="mb-3 text-xl font-bold text-gray-900">Result</h5>
            <p class="text-gray-600">
              The patient's confidence returned instantly — the restoration blended flawlessly with adjacent teeth, and
              the dentist reported a perfect fit on the first try-in.
            </p>
          </div>
        </div>

        <!-- CTA Button -->
        <div class="mt-12 text-center">
          <NuxtLink
            to="#quote"
            class="inline-block rounded-full bg-blue-700 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Start Your Case
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts"></script>
