<template>
  <section class="py-16">
    <div class="container mx-auto px-4 md:px-8">
      <div class="space-y-16">
        <div
          v-for="(product, index) in products"
          :key="product.title"
          class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2"
          :class="index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''"
        >
          <!-- Product Image -->
          <div
            class="rounded-4xl relative aspect-[4/3] overflow-hidden bg-gray-200"
            :class="index % 2 === 1 ? 'lg:col-start-2' : ''"
          >
            <NuxtImg
              v-if="product.image"
              :src="product.image"
              :alt="product.title"
              class="h-full w-full object-cover"
            />
          </div>

          <!-- Product Content -->
          <div class="space-y-6" :class="index % 2 === 1 ? 'lg:col-start-1' : ''">
            <h2 class="text-3xl font-light text-gray-900 md:text-4xl">
              {{ product.title }}
            </h2>
            <p class="text-lg leading-relaxed text-gray-600">
              {{ product.detailedDesc }}
            </p>
            <button
              class="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Learn More
              <Icon name="ri:arrow-right-line" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Product {
  title: string;
  desc: string;
  detailedDesc: string;
  image?: string;
}

interface Props {
  products: Product[];
}

defineProps<Props>();
</script>
