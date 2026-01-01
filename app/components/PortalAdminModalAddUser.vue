<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';
import { roleOptions } from '~~/shared/utils/users';
import type { Practice } from '~~/shared/types/practice';

const emit = defineEmits<{
  success: [];
}>();

const { data: practices } = await useFetch<Practice[]>('/api/practices');

const PRACTICE_ROLES = ['PRACTICE_STAFF', 'PRACTICE_ADMIN'] as const;

const schema = z
  .object({
    email: z.email('Invalid email'),
    name: z.string().min(1, 'Name is required'),
    role: z.enum(['USER', 'ADMIN', 'PRACTICE_STAFF', 'PRACTICE_ADMIN']),
    practiceId: z.string().optional(),
    useSso: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (PRACTICE_ROLES.includes(data.role as (typeof PRACTICE_ROLES)[number]) && !data.practiceId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Practice is required for practice roles',
        path: ['practiceId'],
      });
    }
  });

type Schema = z.output<typeof schema>;

const form = reactive<Schema>({
  email: '',
  name: '',
  role: 'USER',
  practiceId: undefined,
  useSso: true,
});

const isSubmitting = ref(false);
const error = ref('');
const temporaryPassword = ref<string | null>(null);
const toast = useToast();
const { copy } = useClipboard();

const isLocked = computed(() => Boolean(temporaryPassword.value));

const filteredRoleOptions = computed(() => {
  return roleOptions.filter(() => {
    // All roles are available for admin users
    return true;
  });
});

const isPracticeRole = computed(() => {
  return PRACTICE_ROLES.includes(form.role as (typeof PRACTICE_ROLES)[number]);
});

const resetForm = () => {
  form.email = '';
  form.name = '';
  form.role = 'USER';
  form.practiceId = undefined;
  form.useSso = true;
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

const addUser = async (payload: Schema) => {
  isSubmitting.value = true;
  error.value = '';
  temporaryPassword.value = null;

  try {
    const res = await $fetch<{ user: unknown; temporaryPassword: string | null }>('/api/admin/users', {
      method: 'POST',
      body: payload,
    });

    temporaryPassword.value = res.temporaryPassword;

    toast.add({ description: 'User added successfully', color: 'success' });

    if (!temporaryPassword.value) {
      resetForm();
    }
    emit('success');
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'statusMessage' in e) {
      error.value = String((e as { statusMessage?: unknown }).statusMessage || 'Failed to add user');
    } else {
      error.value = 'Failed to add user';
    }
    console.error('Failed to add user', e);
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};

const onSubmit = async (event: FormSubmitEvent<Schema>, close: () => void) => {
  if (temporaryPassword.value) return;

  const payload: Schema = {
    ...event.data,
    practiceId: isPracticeRole.value ? (event.data.practiceId ?? undefined) : undefined,
  };

  await addUser(payload);

  if (!error.value && !temporaryPassword.value) {
    close();
  }
};

// Reset practiceId when role changes
let lastDefaultUseSso = ['USER', 'ADMIN'].includes(form.role);

watch(
  () => form.role,
  () => {
    if (!isPracticeRole.value) {
      form.practiceId = undefined;
    }

    const nextDefaultUseSso = ['USER', 'ADMIN'].includes(form.role);
    if (form.useSso === lastDefaultUseSso) {
      form.useSso = nextDefaultUseSso;
    }
    lastDefaultUseSso = nextDefaultUseSso;
    temporaryPassword.value = null;
  }
);
</script>

<template>
  <UModal>
    <UButton icon="i-ri-user-add-line"> Add User </UButton>

    <template #content="{ close }">
      <UForm :schema="schema" :state="form" @submit="(event) => onSubmit(event, close)">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Add Allowed User</h3>
          </template>

          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Add a new user to the system. You can choose whether they will sign in with Microsoft SSO or with an
              email/password.
            </p>

            <UFormField label="Email" name="email" required>
              <UInput
                id="email"
                v-model="form.email"
                class="w-full"
                type="email"
                placeholder="user@example.com"
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
                :items="filteredRoleOptions"
                value-key="value"
                label-key="label"
                :search-input="false"
                :disabled="isLocked"
              />
            </UFormField>

            <UFormField label="Authentication" name="useSso">
              <UCheckbox
                v-model="form.useSso"
                label="Use Microsoft SSO (no password)"
                description="If unchecked, a temporary password will be generated and the user will be forced to change it on first login."
                :disabled="isLocked"
              />
            </UFormField>

            <UFormField v-if="isPracticeRole" label="Practice" name="practiceId" required>
              <USelectMenu
                id="practice"
                v-model="form.practiceId"
                class="w-full"
                :items="practices || []"
                value-key="id"
                label-key="name"
                placeholder="Select a practice"
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
                <UButton :loading="isSubmitting" type="submit"> Add User </UButton>
              </template>
            </div>
          </template>
        </UCard>
      </UForm>
    </template>
  </UModal>
</template>
