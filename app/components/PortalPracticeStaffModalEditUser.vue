<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';
import type { User } from '~~/server/types/user';
import { roleOptions } from '~~/shared/utils/users';

const props = defineProps<{
  user: User;
  practiceId: string;
}>();

const emit = defineEmits<{
  success: [];
  close: [];
}>();

const { user: currentUser } = useUserSession();
const isSelf = computed(() => props.user.id === currentUser.value?.id);

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email'),
  role: z.enum(['PRACTICE_STAFF', 'PRACTICE_ADMIN']),
});

type Schema = z.output<typeof schema>;

const form = reactive<Schema>({
  name: props.user.name ?? '',
  email: props.user.email ?? '',
  role: (props.user.role as 'PRACTICE_STAFF' | 'PRACTICE_ADMIN') ?? 'PRACTICE_STAFF',
});

const practiceRoleOptions = roleOptions.filter(
  (opt) => opt.value === 'PRACTICE_STAFF' || opt.value === 'PRACTICE_ADMIN'
);

const isOpen = ref(false);
const isSaving = ref(false);
const isResetting = ref(false);
const error = ref('');
const temporaryPassword = ref<string | null>(null);

const toast = useToast();
const { copy } = useClipboard();

const isLocked = computed(() => Boolean(temporaryPassword.value));

const open = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
  temporaryPassword.value = null;
  error.value = '';
  emit('close');
};

const copyTemporaryPassword = async () => {
  if (!temporaryPassword.value) return;
  try {
    await copy(temporaryPassword.value);
    toast.add({ description: 'Temporary password copied to clipboard', color: 'success' });
  } catch (e) {
    console.error('Failed to copy temporary password', e);
    toast.add({ description: 'Failed to copy temporary password', color: 'error' });
  }
};

const onSubmit = async (_event: FormSubmitEvent<Schema>) => {
  if (isLocked.value) return;
  isSaving.value = true;
  error.value = '';

  try {
    await $fetch(`/api/practices/${props.practiceId}/users/${props.user.id}`, {
      method: 'PATCH',
      body: form,
    });
    toast.add({ description: 'Staff updated', color: 'success' });
    emit('success');
    close();
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'statusMessage' in e
        ? String((e as { statusMessage?: unknown }).statusMessage)
        : '';
    error.value = msg || 'Failed to update staff';
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSaving.value = false;
  }
};

const resetPassword = async () => {
  if (isSelf.value) return;
  const confirmed = confirm(
    `Reset password for ${props.user.email}? They will be forced to set a new password on next login.`
  );
  if (!confirmed) return;

  isResetting.value = true;
  error.value = '';

  try {
    const res = await $fetch<{ temporaryPassword: string }>(
      `/api/practices/${props.practiceId}/users/${props.user.id}/reset-password`,
      { method: 'POST' }
    );
    temporaryPassword.value = res.temporaryPassword;
    toast.add({ description: 'Password reset — share the temp password securely', color: 'success' });
    emit('success');
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'statusMessage' in e
        ? String((e as { statusMessage?: unknown }).statusMessage)
        : '';
    error.value = msg || 'Failed to reset password';
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isResetting.value = false;
  }
};

defineExpose({ open });
</script>

<template>
  <UModal v-model:open="isOpen" :title="`Edit ${user.name || user.email}`" @update:open="(v) => !v && close()">
    <template #content>
      <UForm :schema="schema" :state="form" @submit="onSubmit">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Edit Practice Staff</h3>
          </template>

          <div class="space-y-4">
            <p v-if="isSelf" class="text-sm text-muted">
              You can edit your own name, but to change your role or password please use
              <NuxtLink to="/password" class="underline">/password</NuxtLink> or ask another admin.
            </p>

            <UFormField label="Name" name="name" required>
              <UInput v-model="form.name" class="w-full" placeholder="Full name" :disabled="isLocked" />
            </UFormField>

            <UFormField label="Email" name="email" required>
              <UInput
                v-model="form.email"
                class="w-full"
                type="email"
                placeholder="staff@practice.com"
                :disabled="isLocked"
              />
            </UFormField>

            <UFormField label="Role" name="role" required>
              <USelectMenu
                v-model="form.role"
                class="w-full"
                :items="practiceRoleOptions"
                value-key="value"
                label-key="label"
                :search-input="false"
                :disabled="isLocked || isSelf"
              />
            </UFormField>

            <div class="border-t border-default pt-4">
              <UButton
                color="warning"
                variant="outline"
                icon="i-ri-key-2-line"
                :loading="isResetting"
                :disabled="isSelf || isLocked || isSaving"
                @click="resetPassword"
              >
                Reset password
              </UButton>
              <p class="mt-2 text-xs text-muted">
                Generates a new temporary password and forces the user to change it on next login.
              </p>
            </div>

            <UAlert
              v-if="temporaryPassword"
              color="warning"
              variant="soft"
              title="Temporary password"
              description="Copy this password now. It will not be shown again."
              icon="i-ri-key-2-line"
            />

            <UInput
              v-if="temporaryPassword"
              :model-value="temporaryPassword"
              class="w-full"
              readonly
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  icon="i-ri-file-copy-line"
                  aria-label="Copy temporary password"
                  @click="copyTemporaryPassword"
                />
              </template>
            </UInput>

            <UAlert v-if="error" color="error" variant="soft" :title="error" />
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton v-if="temporaryPassword" color="primary" @click="close">
                I copied the password, continue
              </UButton>
              <template v-else>
                <UButton type="button" color="neutral" variant="ghost" @click="close">Cancel</UButton>
                <UButton :loading="isSaving" :disabled="isResetting" type="submit">Save changes</UButton>
              </template>
            </div>
          </template>
        </UCard>
      </UForm>
    </template>
  </UModal>
</template>
