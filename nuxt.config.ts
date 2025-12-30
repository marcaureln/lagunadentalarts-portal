const cacheTTL = 60 * 60 * 24 * 365; // 1 year – you can set this to whatever you want

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-06-14',
  sourcemap: true,
  devtools: { enabled: true },
  app: {
    head: {
      link: [{ rel: 'icon', href: '/favicon.png' }],
    },
  },
  css: ['~/assets/css/main.css'],
  ui: {
    colorMode: false,
  },
  nitro: {
    compressPublicAssets: true,
    routeRules: {
      '/img/**': { headers: { 'cache-control': `public,max-age=${cacheTTL},s-maxage=${cacheTTL}` } },
      '/_nuxt/**': { headers: { 'cache-control': `public,max-age=${cacheTTL},s-maxage=${cacheTTL}` } },
    },
  },
  vite: {
    server: {
      // allowedHosts: true, // Uncomment this line if you are using a local tunnel like ngrok
    },
  },
  modules: [
    '@nuxt/ui',
    '@nuxtjs/seo',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxt/scripts',
    '@nuxt/image',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
    'nuxt-mcp-dev',
  ],
  site: {
    url: 'https://lagunadentalarts.com/',
    name: 'Laguna Dental Arts',
    description: 'Laguna Dental Arts is a premier dental practice offering comprehensive care in California.',
    defaultLocale: 'en',
  },
  fonts: {
    defaults: {
      weights: [100, 300, 400, 500, 600, 700],
      styles: ['normal', 'italic'],
    },
  },
  linkChecker: {
    enabled: false, // TODO: Enable this in production
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        paths: {
          '@': ['.'],
          '@/*': ['./*'],
        },
      },
    },
  },
});
