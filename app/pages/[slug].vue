<template>
  <main>
    <div class="bg-white py-16 md:py-24">
      <div class="container mx-auto px-4 md:px-8">
        <div
          class="prose prose-lg prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-700 hover:prose-a:underline prose-strong:text-gray-900 prose-ul:text-gray-600 prose-li:text-gray-600 mx-auto max-w-4xl"
        >
          <ContentRenderer :value="post" />
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup>
const slug = useRoute().params.slug;
const { data: post } = await useAsyncData(`page-${slug}`, () => {
  return queryCollection('pages').path(`/pages/${slug}`).first();
});

useSeoMeta({
  title: post.value?.title,
  description: post.value?.description,
});
</script>
