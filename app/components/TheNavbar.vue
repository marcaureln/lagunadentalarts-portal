<template>
  <header class="bg-white">
    <div class="container mx-auto flex items-center justify-between px-4 py-4 md:px-8">
      <NuxtLink to="/">
        <NuxtImg src="/logo.png" alt="Laguna Dental Arts Logo" height="100" />
      </NuxtLink>
      <nav class="hidden gap-9 text-sm text-gray-700 md:flex">
        <NuxtLink to="/" class="hover:text-blue-700">Home</NuxtLink>
        <NuxtLink to="/about" class="hover:text-blue-700">About</NuxtLink>
        <NuxtLink to="#" class="hover:text-blue-700">Products</NuxtLink>
        <NuxtLink to="/downloads" class="hover:text-blue-700">Downloads</NuxtLink>
        <NuxtLink to="/contact" class="hover:text-blue-700">Contact</NuxtLink>
      </nav>
      <div class="flex gap-3">
        <NuxtLink to="/digital-upload" class="rounded-4xl bg-blue-700 px-4 py-2 text-xs text-white hover:bg-blue-800">
          Digital Upload
        </NuxtLink>
        <NuxtLink
          to="https://lagunadentalarts.absevolutionwebservices.com"
          class="rounded-4xl border border-blue-700 px-4 py-2 text-xs text-blue-700 hover:bg-blue-50"
          external
        >
          Doctor Login
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts"></script>
