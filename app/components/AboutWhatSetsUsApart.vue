<template>
  <section class="bg-white py-16 md:py-24">
    <div class="container mx-auto px-4 md:px-8">
      <div class="flex flex-col items-start gap-16 lg:flex-row lg:gap-24">
        <div class="lg:w-1/3">
          <h2 class="mb-6 text-3xl font-light leading-tight text-gray-900 md:text-5xl">
            What Sets<br />
            Us Apart
          </h2>
          <p class="leading-relaxed text-gray-600">
            At Laguna Dental Arts, we combine technical precision with personal service. Our lab is built on clear
            communication, reliable turnarounds, and a commitment to helping dental practices thrive—one case at a time.
          </p>
        </div>

        <div class="lg:w-2/3">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div v-for="(feature, idx) in features" :key="idx" class="rounded-2xl border border-gray-100 p-6">
              <div class="my-3 mt-16">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
                  <Icon :name="feature.icon" class="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 class="mb-3 text-xl font-semibold text-gray-900">{{ feature.title }}</h3>
              <p class="leading-relaxed text-gray-600">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    icon: 'ri:time-line',
    title: 'Reliable Turnaround Times',
    description: 'We understand deadlines. Our team works efficiently while maintaining quality and accuracy.',
  },
  {
    icon: 'ri:checkbox-circle-line',
    title: 'Fully Digital Ready',
    description: 'We support all major intraoral scanners and help simplify your digital workflows.',
  },
  {
    icon: 'ri:customer-service-2-line',
    title: 'Dedicated Support',
    description: 'Need to speak with someone? Our team is always here to provide answers and support.',
  },
  {
    icon: 'ri:flashlight-line',
    title: 'Rush Case Options',
    description: 'We offer expedited services for patients with urgent clinical needs.',
  },
];
</script>
