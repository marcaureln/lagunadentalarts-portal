<template>
  <footer class="mt-12 py-12">
    <div class="container mx-auto flex flex-col justify-between gap-8 px-4 md:flex-row md:px-8">
      <div class="flex flex-col gap-4 md:w-1/3">
        <div class="mb-2 flex items-center gap-2">
          <NuxtLink to="/">
            <NuxtImg src="/logo.png" width="200" alt="Laguna Dental Arts Logo" />
          </NuxtLink>
        </div>
        <div class="text-gray-500">© 2025 Laguna Dental Arts. All rights reserved.</div>
        <div class="mt-2 flex gap-9">
          <NuxtLink to="#" class="text-gray-500 hover:text-blue-700" external>
            <Icon name="ri:facebook-fill" size="24px" />
          </NuxtLink>
          <NuxtLink to="#" class="text-gray-500 hover:text-blue-700" external>
            <Icon name="ri:instagram-line" size="24px" />
          </NuxtLink>
          <NuxtLink to="#" class="text-gray-500 hover:text-blue-700" external>
            <Icon name="ri:linkedin-fill" size="24px" />
          </NuxtLink>
        </div>
      </div>
      <div class="grid flex-1 grid-cols-2 gap-6 md:grid-cols-4">
        <div v-for="(section, idx) in menuSections" :key="idx">
          <div class="mb-3 text-gray-500">{{ section.title }}</div>
          <ul class="space-y-1">
            <li v-for="(item, j) in section.items" :key="j">
              <NuxtLink :to="item.to" class="leading-7 hover:text-blue-700">{{ item.label }}</NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="container mx-auto mt-8 px-4 leading-7 text-gray-400 md:px-8">
      This website is intended for use by licensed dental professionals only. Laguna Dental Arts is a HIPAA-compliant
      dental laboratory serving practices throughout California. All content is for informational purposes only and does
      not constitute dental or medical advice.
    </div>
  </footer>
</template>

<script setup lang="ts">
const menuSections = [
  {
    title: 'For Dentists',
    items: [
      { label: 'Send a Case', to: '#' },
      // { label: 'Rush Cases', to: '#' },
      // { label: 'Digital Workflow', to: '#' },
      // { label: 'Turnaround Times', to: '#' },
      { label: 'Rx Form Download', to: '/downloads' },
    ],
  },
  {
    title: 'About the Lab',
    items: [
      { label: 'About Us', to: '/about' },
      // { label: 'Our Team', to: '/team' },
      { label: 'Why Choose Us', to: '/about#why-choose-us' },
      // { label: 'Careers', to: '/careers' },
      // { label: 'Testimonials', to: '/#testimonials' },
    ],
  },
  {
    title: 'Contact & Support',
    items: [
      { label: 'Contact Us', to: '/contact' },
      // { label: 'FAQ', to: '/faq' },
      { label: 'Schedule a Call', to: '#' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Terms & Conditions', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy' },
    ],
  },
];
</script>
