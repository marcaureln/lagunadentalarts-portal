const cacheTTL = 60 * 60 * 24 * 365; // 1 year – you can set this to whatever you want

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-06-14',
  runtimeConfig: {
    storagePath: process.env.STORAGE_PATH,
    s3Bucket: process.env.S3_BUCKET,
    s3Region: process.env.S3_REGION || 'auto',
    s3Endpoint: process.env.S3_ENDPOINT,
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
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
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxt/scripts',
    '@nuxt/image',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
  ],
  fonts: {
    defaults: {
      weights: [100, 300, 400, 500, 600, 700],
      styles: ['normal', 'italic'],
    },
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
