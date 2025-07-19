<template>
  <section class="bg-white py-16 md:py-24">
    <div class="container mx-auto px-4 md:px-8">
      <div class="mx-auto max-w-4xl">
        <div v-for="(category, categoryIndex) in categories" :key="categoryIndex" class="mb-12">
          <h2 class="mb-8 text-2xl font-semibold text-gray-900 md:text-3xl">{{ category.title }}</h2>

          <div class="space-y-4">
            <div
              v-for="(item, itemIndex) in category.questions"
              :key="itemIndex"
              class="rounded-lg border border-gray-200 bg-white"
            >
              <button
                class="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-gray-50"
                @click="toggleQuestion(categoryIndex, itemIndex)"
              >
                <span class="text-lg font-medium text-gray-900">{{ item.question }}</span>
                <Icon
                  name="ri:add-line"
                  class="h-5 w-5 text-gray-500 transition-transform"
                  :class="{ 'rotate-45': isOpen(categoryIndex, itemIndex) }"
                />
              </button>

              <div v-if="isOpen(categoryIndex, itemIndex)" class="border-t border-gray-200 p-6 pt-4">
                <p class="leading-relaxed text-gray-600">{{ item.answer }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  categories?: {
    title: string;
    questions: {
      question: string;
      answer: string;
    }[];
  }[];
}>();

const openQuestions = ref(new Set<string>());

const toggleQuestion = (categoryIndex: number, itemIndex: number) => {
  const key = `${categoryIndex}-${itemIndex}`;
  if (openQuestions.value.has(key)) {
    openQuestions.value.delete(key);
  } else {
    openQuestions.value.add(key);
  }
};

const isOpen = (categoryIndex: number, itemIndex: number) => {
  const key = `${categoryIndex}-${itemIndex}`;
  return openQuestions.value.has(key);
};
</script>
