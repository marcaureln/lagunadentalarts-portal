<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';
import { roleOptions } from '~~/shared/utils/users';

const props = defineProps<{
  practiceId: string;
}>();

const emit = defineEmits<{
  success: [];
}>();

const schema = z.object({
  email: z.email('Invalid email'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['PRACTICE_STAFF', 'PRACTICE_ADMIN']),
});

type Schema = z.output<typeof schema>;

const form = reactive<Schema>({
  email: '',
  name: '',
  role: 'PRACTICE_STAFF',
});

const isSubmitting = ref(false);
const error = ref('');
const temporaryPassword = ref<string | null>(null);
const toast = useToast();
const { copy } = useClipboard();

const isLocked = computed(() => Boolean(temporaryPassword.value));

const practiceRoleOptions = roleOptions.filter(
  (opt) => opt.value === 'PRACTICE_STAFF' || opt.value === 'PRACTICE_ADMIN'
);

const resetForm = () => {
  form.email = '';
  form.name = '';
  form.role = 'PRACTICE_STAFF';
  error.value = '';
  temporaryPassword.value = null;
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

const addStaff = async (payload: Schema) => {
  isSubmitting.value = true;
  error.value = '';
  temporaryPassword.value = null;

  try {
    const res = await $fetch<{ user: unknown; temporaryPassword: string | null }>(
      `/api/practices/${props.practiceId}/users`,
      {
        method: 'POST',
        body: payload,
      }
    );

    temporaryPassword.value = res.temporaryPassword;
    toast.add({ description: 'Staff added successfully', color: 'success' });

    if (!temporaryPassword.value) resetForm();
    emit('success');
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'statusMessage' in e) {
      error.value = String((e as { statusMessage?: unknown }).statusMessage || 'Failed to add staff');
    } else {
      error.value = 'Failed to add staff';
    }
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};

const onSubmit = async (event: FormSubmitEvent<Schema>, close: () => void) => {
  if (temporaryPassword.value) return;
  await addStaff(event.data);
  if (!error.value && !temporaryPassword.value) close();
};
</script>

<template>
  <UModal>
    <UButton icon="i-ri-user-add-line"> Add Staff </UButton>

    <template #content="{ close }">
      <UForm :schema="schema" :state="form" @submit="(event) => onSubmit(event, close)">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Add Practice Staff</h3>
          </template>

          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Add a new staff member to this practice. A temporary password will be generated and they will be forced to
              change it on first login.
            </p>

            <UFormField label="Email" name="email" required>
              <UInput
                id="email"
                v-model="form.email"
                class="w-full"
                type="email"
                placeholder="staff@practice.com"
                :disabled="isLocked"
              />
            </UFormField>

            <UFormField label="Name" name="name" required>
              <UInput id="name" v-model="form.name" class="w-full" placeholder="Full name" :disabled="isLocked" />
            </UFormField>

            <UFormField label="Role" name="role" required>
              <USelectMenu
                id="role"
                v-model="form.role"
                class="w-full"
                :items="practiceRoleOptions"
                value-key="value"
                label-key="label"
                :search-input="false"
                :disabled="isLocked"
              />
            </UFormField>

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
              <UButton
                v-if="temporaryPassword"
                type="button"
                color="primary"
                @click="
                  () => {
                    resetForm();
                    close();
                  }
                "
              >
                I copied the password, continue
              </UButton>

              <template v-else>
                <UButton
                  type="button"
                  color="neutral"
                  variant="ghost"
                  @click="
                    resetForm();
                    close();
                  "
                >
                  Cancel
                </UButton>
                <UButton :loading="isSubmitting" type="submit"> Add Staff </UButton>
              </template>
            </div>
          </template>
        </UCard>
      </UForm>
    </template>
  </UModal>
</template>
