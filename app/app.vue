<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script lang="ts" setup>
useSeoMeta({
  titleTemplate: (title) => (title ? `${title} — Laguna Dental Arts` : 'Laguna Dental Arts'),
});
</script>
