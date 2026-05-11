// Redirect to /login on any 401 response from the API so mid-session expiry doesn't strand the user
// on a screen that quietly fails to load. The global auth middleware handles the initial-nav case;
// this handles in-app mutations and lazy fetches.
export default defineNuxtPlugin(() => {
  globalThis.$fetch = globalThis.$fetch.create({
    async onResponseError({ response }) {
      if (response?.status !== 401) return;
      const route = useRoute();
      if (route.path === '/login') return;
      await navigateTo(`/login?redirectTo=${encodeURIComponent(route.fullPath)}`);
    },
  });
});
