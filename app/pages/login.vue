<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

definePageMeta({
  layout: 'auth',
});

useSeoMeta({ title: 'Login' });

const route = useRoute();
const error = computed(() => route.query.error);
const passwordChanged = computed(() => route.query.passwordChanged === '1');

const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type Schema = z.output<typeof schema>;

const form = reactive<Schema>({
  email: '',
  password: '',
});

const showPassword = ref(false);
const isSubmitting = ref(false);
const formError = ref('');

const errorMessage = computed(() => {
  switch (error.value) {
    case 'AccessDenied':
      return 'You are not authorized to access this portal. Please contact an administrator.';
    case 'OAuthError':
      return 'An error occurred during sign in. Please try again.';
    case 'MissingEmail':
      return 'Unable to determine your email from Microsoft login. Please contact support.';
    default:
      return 'An error occurred during sign in. Please try again.';
  }
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true;
  formError.value = '';

  try {
    const res = await $fetch<{ success: boolean; redirectTo: string }>('/auth/login', {
      method: 'POST',
      body: {
        email: event.data.email,
        password: event.data.password,
      },
    });

    await navigateTo(res.redirectTo);
  } catch (e: unknown) {
    console.error(e);
    formError.value = 'Invalid email or password';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Left Side - Image -->
    <div class="hidden items-center justify-center bg-gray-100 lg:flex lg:w-1/2">
      <img
        src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=1974&auto=format&fit=crop"
        alt="Dental professional at work"
        class="h-full w-full object-cover"
      />
    </div>

    <!-- Right Side - Login Form -->
    <div class="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2">
      <div class="w-full max-w-sm space-y-8">
        <!-- Logo -->
        <div class="flex justify-center">
          <img src="/logo.png" alt="Laguna Dental Arts" class="h-16 w-auto" />
        </div>

        <!-- Error Message -->
        <UAlert
          v-if="passwordChanged"
          color="success"
          variant="soft"
          title="Password updated"
          description="Password updated, please log in again."
          icon="i-ri-check-line"
        />

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          title="Access Denied"
          :description="errorMessage"
          icon="i-ri-error-warning-line"
        />

        <!-- Login Form -->
        <div class="space-y-4">
          <div class="text-center">
            <h2 class="text-2xl font-semibold text-gray-900">Welcome Back</h2>
            <p class="mt-2 text-sm text-gray-600">Sign in to continue</p>
          </div>

          <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
            <UFormField label="Email" name="email">
              <UInput
                id="email"
                v-model="form.email"
                class="w-full"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
              />
            </UFormField>

            <UFormField label="Password" name="password">
              <UInput
                id="password"
                v-model="form.password"
                class="w-full"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                :ui="{ trailing: 'pe-1' }"
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="showPassword ? 'i-ri-eye-off-line' : 'i-ri-eye-line'"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    :aria-pressed="showPassword"
                    aria-controls="password"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </UInput>
            </UFormField>

            <UAlert v-if="formError" color="error" variant="soft" :title="formError" />

            <UButton :loading="isSubmitting" type="submit" color="primary" size="lg" block>Sign in</UButton>
          </UForm>

          <USeparator class="my-6" label="OR" color="neutral" size="sm" />

          <!-- Microsoft SSO Button -->
          <UButton to="/auth/microsoft" color="primary" size="lg" block icon="i-ri-microsoft-fill" :external="true">
            Sign in with Microsoft
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
