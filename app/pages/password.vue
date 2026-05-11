<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import { useApiMutation } from '~~/app/composables/useApiMutation';

definePageMeta({
  layout: 'auth',
});

useSeoMeta({ title: 'Change Password' });

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  currentPassword: '',
  newPassword: '',
});

const showCurrent = ref(false);
const showNew = ref(false);
const passwordMutation = useApiMutation('Failed to update password');
const isSubmitting = passwordMutation.isLoading;
const error = computed(() => passwordMutation.error.value ?? '');

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const ok = await passwordMutation.mutate(
    '/api/auth/password',
    {
      method: 'POST',
      body: { currentPassword: event.data.currentPassword, newPassword: event.data.newPassword },
    },
    { successMessage: 'Password updated successfully' }
  );
  if (ok === null) return;
  await navigateTo('/auth/logout?redirectTo=/login?passwordChanged=1', { external: true });
}
</script>

<template>
  <div class="flex min-h-screen">
    <div class="hidden items-center justify-center bg-gray-100 lg:flex lg:w-1/2">
      <img
        src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=1974&auto=format&fit=crop"
        alt="Dental professional at work"
        class="h-full w-full object-cover"
      />
    </div>

    <div class="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2">
      <div class="w-full max-w-md space-y-6">
        <div class="flex justify-center">
          <img src="/logo.png" alt="Laguna Dental Arts" class="h-16 w-auto" />
        </div>

        <div class="text-center">
          <h2 class="text-2xl font-semibold text-gray-900">Change your password</h2>
          <p class="mt-2 text-sm text-gray-600">You must update your password before continuing.</p>
        </div>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Current password" name="currentPassword">
            <UInput
              id="currentPassword"
              v-model="state.currentPassword"
              class="w-full"
              :type="showCurrent ? 'text' : 'password'"
              autocomplete="current-password"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showCurrent ? 'i-ri-eye-off-line' : 'i-ri-eye-line'"
                  :aria-label="showCurrent ? 'Hide password' : 'Show password'"
                  :aria-pressed="showCurrent"
                  aria-controls="currentPassword"
                  @click="showCurrent = !showCurrent"
                />
              </template>
            </UInput>
          </UFormField>

          <UFormField label="New password" name="newPassword">
            <UInput
              id="newPassword"
              v-model="state.newPassword"
              class="w-full"
              :type="showNew ? 'text' : 'password'"
              autocomplete="new-password"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showNew ? 'i-ri-eye-off-line' : 'i-ri-eye-line'"
                  :aria-label="showNew ? 'Hide password' : 'Show password'"
                  :aria-pressed="showNew"
                  aria-controls="newPassword"
                  @click="showNew = !showNew"
                />
              </template>
            </UInput>
          </UFormField>

          <UAlert v-if="error" color="error" variant="soft" :title="error" />

          <UButton :loading="isSubmitting" type="submit" block size="lg" color="primary">Update password</UButton>
        </UForm>
      </div>
    </div>
  </div>
</template>
