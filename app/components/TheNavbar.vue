<template>
  <header class="bg-white">
    <div class="container mx-auto flex items-center justify-between px-4 py-4 md:px-8">
      <NuxtLink to="/">
        <NuxtImg src="/logo.png" alt="Laguna Dental Arts Logo" class="h-12 w-auto md:h-16" />
      </NuxtLink>

      <!-- Desktop Navigation -->
      <nav v-if="navLinks.length" class="hidden gap-6 text-sm text-gray-700 lg:flex xl:gap-9">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="transition-colors hover:text-blue-700"
          :class="{ 'font-semibold text-blue-700': route.path === link.to }"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Desktop Actions -->
      <div v-if="actions.length" class="hidden gap-2 md:flex md:gap-3">
        <NuxtLink
          v-for="action in actions"
          :key="action.to"
          :to="action.to"
          :external="action.external || false"
          class="rounded-4xl px-3 py-2 text-xs font-medium transition-colors md:px-4"
          :class="action.classes"
        >
          <span class="hidden sm:inline">{{ action.label }}</span>
          <span class="sm:hidden">{{ action.short }}</span>
        </NuxtLink>
      </div>

      <!-- Mobile Menu Button -->
      <button
        class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 lg:hidden"
        aria-label="Toggle navigation menu"
        :aria-expanded="isMenuOpen"
        aria-controls="mobile-menu"
        @click="isMenuOpen = !isMenuOpen"
      >
        <Icon :name="isMenuOpen ? 'ri:close-line' : 'ri:menu-line'" size="24px" />
      </button>
    </div>

    <!-- Mobile Navigation Menu -->
    <Transition name="mobile-nav" appear>
      <div
        v-if="isMenuOpen && (navLinks.length || actions.length)"
        id="mobile-menu"
        class="border-t border-gray-200 bg-white lg:hidden"
      >
        <nav class="container mx-auto px-4 py-4">
          <div class="space-y-1">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="block rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-blue-700"
              :class="{ 'bg-blue-50 font-medium text-blue-700': route.path === link.to }"
              @click="closeMenu()"
            >
              {{ link.label }}
            </NuxtLink>
          </div>

          <!-- Mobile Actions -->
          <div class="space-y-3 border-gray-200 pt-4 md:hidden">
            <NuxtLink
              v-for="action in actions"
              :key="action.to"
              :to="action.to"
              :external="action.external || false"
              class="rounded-4xl block px-4 py-2 text-center text-sm font-medium transition-colors"
              :class="action.classes"
              @click="closeMenu()"
            >
              {{ action.label }}
            </NuxtLink>
          </div>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
interface NavLink {
  to: string;
  label: string;
}
interface ActionLink {
  to: string;
  label: string;
  short?: string;
  external?: boolean;
  classes: string;
}

interface Props {
  navLinks?: NavLink[];
  actions?: ActionLink[]; // desktop actions
}

withDefaults(defineProps<Props>(), {
  navLinks: () => [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/team', label: 'Team' },
    { to: '/products', label: 'Products' },
    { to: '/downloads', label: 'Downloads' },
    { to: '/contact', label: 'Contact' },
  ],
  actions: () => [
    {
      to: '/digital-upload',
      label: 'Digital Upload',
      short: 'Upload',
      classes: 'bg-blue-700 text-white hover:bg-blue-800',
    },
    {
      to: '/portal/login',
      label: 'Doctor Login',
      short: 'Login',
      classes: 'border border-blue-700 text-blue-700 hover:bg-blue-50',
    },
  ],
});

const isMenuOpen = ref(false);

// Route + close behavior
const route = useRoute();
const closeMenu = () => {
  isMenuOpen.value = false;
  enableScroll();
};
watch(
  () => route.path,
  () => closeMenu()
);

// Scroll lock when menu open
const disableScroll = () => {
  document.documentElement.style.overflow = 'hidden';
};
const enableScroll = () => {
  document.documentElement.style.overflow = '';
};
watch(isMenuOpen, (open) => {
  if (open) disableScroll();
  else enableScroll();
});

// Escape key to close
onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isMenuOpen.value) closeMenu();
  };
  window.addEventListener('keydown', handler);
  onBeforeUnmount(() => window.removeEventListener('keydown', handler));
});
</script>

<style scoped>
/* Mobile nav transition */
.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}
.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.mobile-nav-enter-to,
.mobile-nav-leave-from {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .mobile-nav-enter-active,
  .mobile-nav-leave-active {
    transition: opacity 120ms linear;
  }
  .mobile-nav-enter-from,
  .mobile-nav-leave-to {
    transform: none;
  }
}
</style>
