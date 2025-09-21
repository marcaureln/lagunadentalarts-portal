<template>
  <header class="bg-white">
    <div class="container mx-auto flex items-center justify-between px-4 py-4 md:px-8">
      <NuxtLink to="/">
        <NuxtImg src="/logo.png" alt="Laguna Dental Arts Logo" height="100" />
      </NuxtLink>

      <!-- Desktop Navigation -->
      <nav class="hidden gap-9 text-gray-700 md:flex">
        <NuxtLink to="/" class="hover:text-blue-700">Home</NuxtLink>
        <NuxtLink to="/about" class="hover:text-blue-700">About</NuxtLink>
        <NuxtLink to="/products" class="hover:text-blue-700">Products</NuxtLink>
        <NuxtLink to="/downloads" class="hover:text-blue-700">Downloads</NuxtLink>
        <NuxtLink to="/contact" class="hover:text-blue-700">Contact</NuxtLink>
      </nav>

      <!-- Desktop Buttons -->
      <div class="hidden gap-3 md:flex">
        <NuxtLink
          to="/digital-upload"
          class="rounded-4xl bg-blue-700 px-4 py-2 font-normal text-white hover:bg-blue-800"
        >
          Digital Upload
        </NuxtLink>
        <NuxtLink
          to="https://lagunadentalarts.absevolutionwebservices.com"
          class="rounded-4xl border border-blue-700 px-4 py-2 font-medium text-blue-700 hover:bg-blue-50"
          external
        >
          Doctor Login
        </NuxtLink>
      </div>

      <!-- Mobile Menu Button -->
      <button
        ref="mobileMenuButton"
        class="flex flex-col items-center justify-center p-2 md:hidden"
        aria-label="Toggle mobile menu"
        @click="toggleMenu"
      >
        <div class="hamburger-line-1 mb-1 h-0.5 w-6 bg-gray-700 transition-transform duration-300"></div>
        <div class="hamburger-line-2 mb-1 h-0.5 w-6 bg-gray-700 transition-opacity duration-300"></div>
        <div class="hamburger-line-3 h-0.5 w-6 bg-gray-700 transition-transform duration-300"></div>
      </button>
    </div>

    <!-- Mobile Navigation Menu -->
    <div
      ref="mobileMenu"
      class="max-h-0 overflow-hidden border-t border-gray-200 bg-white opacity-0 transition-all duration-300 ease-in-out md:hidden"
    >
      <nav class="container mx-auto px-4 py-4">
        <div class="flex flex-col gap-4">
          <NuxtLink to="/" class="py-2 text-gray-700 transition-colors hover:text-blue-700" @click="closeMenu">
            Home
          </NuxtLink>
          <NuxtLink to="/about" class="py-2 text-gray-700 transition-colors hover:text-blue-700" @click="closeMenu">
            About
          </NuxtLink>
          <NuxtLink to="/products" class="py-2 text-gray-700 transition-colors hover:text-blue-700" @click="closeMenu">
            Products
          </NuxtLink>
          <NuxtLink to="/downloads" class="py-2 text-gray-700 transition-colors hover:text-blue-700" @click="closeMenu">
            Downloads
          </NuxtLink>
          <NuxtLink to="/contact" class="py-2 text-gray-700 transition-colors hover:text-blue-700" @click="closeMenu">
            Contact
          </NuxtLink>

          <!-- Mobile Buttons -->
          <div class="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4">
            <NuxtLink
              to="/digital-upload"
              class="rounded-4xl bg-blue-700 px-4 py-3 text-center text-white transition-colors hover:bg-blue-800"
              @click="closeMenu"
            >
              Digital Upload
            </NuxtLink>
            <NuxtLink
              to="https://lagunadentalarts.absevolutionwebservices.com"
              class="rounded-4xl border border-blue-700 px-4 py-3 text-center text-blue-700 transition-colors hover:bg-blue-50"
              external
              @click="closeMenu"
            >
              Doctor Login
            </NuxtLink>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const mobileMenu = ref<HTMLElement>();
const mobileMenuButton = ref<HTMLElement>();
let isMenuOpen = false;

function toggleMenu() {
  isMenuOpen = !isMenuOpen;

  if (mobileMenu.value) {
    if (isMenuOpen) {
      mobileMenu.value.style.maxHeight = '28rem';
      mobileMenu.value.style.opacity = '1';
    } else {
      mobileMenu.value.style.maxHeight = '0';
      mobileMenu.value.style.opacity = '0';
    }
  }

  // Animate hamburger button
  if (mobileMenuButton.value) {
    const lines = mobileMenuButton.value.querySelectorAll('div');
    if (isMenuOpen) {
      lines[0]?.classList.add('rotate-45', 'translate-y-1.5');
      lines[1]?.classList.add('opacity-0');
      lines[2]?.classList.add('-rotate-45', '-translate-y-1.5');
    } else {
      lines[0]?.classList.remove('rotate-45', 'translate-y-1.5');
      lines[1]?.classList.remove('opacity-0');
      lines[2]?.classList.remove('-rotate-45', '-translate-y-1.5');
    }
  }
}

function closeMenu() {
  if (isMenuOpen) {
    toggleMenu();
  }
}

// Close mobile menu when clicking outside
onMounted(() => {
  const handleClickOutside = (event: Event) => {
    const target = event.target as Element;
    if (isMenuOpen && !target.closest('header')) {
      closeMenu();
    }
  };

  document.addEventListener('click', handleClickOutside);

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
});
</script>
