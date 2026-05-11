<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { User } from '~~/server/types/user';
import { roleOptions } from '~~/shared/utils/users';
import { practiceRoleSchema } from '~~/shared/schemas/user';
import { useTemporaryPassword } from '~~/app/composables/useTemporaryPassword';
import { useApiMutation } from '~~/app/composables/useApiMutation';

const props = defineProps<{ practiceId: string; user?: User }>();
const emit = defineEmits<{ success: []; close: [] }>();

const isEdit = computed(() => Boolean(props.user));

const { user: currentUser } = useUserSession();
const isSelf = computed(() => isEdit.value && props.user?.id === currentUser.value?.id);

const addSchema = z.object({
  email: z.email('Invalid email'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['PRACTICE_STAFF', 'PRACTICE_ADMIN']),
});
const editSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email'),
  role: z.enum(['PRACTICE_STAFF', 'PRACTICE_ADMIN']),
});

type AddSchema = z.output<typeof addSchema>;
type EditSchema = z.output<typeof editSchema>;

const addForm = reactive<AddSchema>({ email: '', name: '', role: 'PRACTICE_STAFF' });
const editForm = reactive<EditSchema>({
  name: props.user?.name ?? '',
  email: props.user?.email ?? '',
  role: practiceRoleSchema.safeParse(props.user?.role).data ?? 'PRACTICE_STAFF',
});

const practiceRoleOptions = roleOptions.filter(
  (opt) => opt.value === 'PRACTICE_STAFF' || opt.value === 'PRACTICE_ADMIN'
);

const isOpen = ref(false);

const addMutation = useApiMutation<{ user: unknown; temporaryPassword: string | null }>('Failed to add staff');
const editMutation = useApiMutation('Failed to update staff');
const resetPasswordMutation = useApiMutation<{ temporaryPassword: string }>('Failed to reset password');

const isSubmitting = computed(() => addMutation.isLoading.value || editMutation.isLoading.value);
const isResetting = resetPasswordMutation.isLoading;
const error = computed(
  () => addMutation.error.value ?? editMutation.error.value ?? resetPasswordMutation.error.value ?? ''
);

const { temporaryPassword, isLocked, copyTemporaryPassword, reset: resetTempPassword } = useTemporaryPassword();

const open = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
  resetTempPassword();
  emit('close');
};

const resetAddForm = () => {
  addForm.email = '';
  addForm.name = '';
  addForm.role = 'PRACTICE_STAFF';
  resetTempPassword();
};

const onAddSubmit = async (event: FormSubmitEvent<AddSchema>) => {
  if (isLocked.value) return;
  resetTempPassword();
  const res = await addMutation.mutate(
    `/api/practices/${props.practiceId}/users`,
    { method: 'POST', body: event.data },
    { successMessage: 'Staff added successfully' }
  );
  if (!res) return;
  temporaryPassword.value = res.temporaryPassword;
  emit('success');
  if (!temporaryPassword.value) {
    resetAddForm();
    close();
  }
};

const onEditSubmit = async (_event: FormSubmitEvent<EditSchema>) => {
  if (isLocked.value || !props.user) return;
  const ok = await editMutation.mutate(
    `/api/practices/${props.practiceId}/users/${props.user.id}`,
    { method: 'PATCH', body: editForm },
    { successMessage: 'Staff updated' }
  );
  if (ok === null) return;
  emit('success');
  close();
};

const resetPassword = async () => {
  if (!props.user || isSelf.value) return;
  const confirmed = confirm(
    `Reset password for ${props.user.email}? They will be forced to set a new password on next login.`
  );
  if (!confirmed) return;
  const res = await resetPasswordMutation.mutate(
    `/api/practices/${props.practiceId}/users/${props.user.id}/reset-password`,
    { method: 'POST' },
    { successMessage: 'Password reset — share the temp password securely' }
  );
  if (!res) return;
  temporaryPassword.value = res.temporaryPassword;
  emit('success');
};

defineExpose({ open });
</script>

<template>
  <UModal v-model:open="isOpen" :title="isEdit ? `Edit ${user?.name || user?.email}` : undefined">
    <UButton v-if="!isEdit" icon="i-ri-user-add-line"> Add Staff </UButton>

    <template #content>
      <UForm
        v-if="!isEdit"
        :schema="addSchema"
        :state="addForm"
        @submit="(event: FormSubmitEvent<AddSchema>) => onAddSubmit(event)"
      >
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
                v-model="addForm.email"
                class="w-full"
                type="email"
                placeholder="staff@practice.com"
                :disabled="isLocked"
              />
            </UFormField>

            <UFormField label="Name" name="name" required>
              <UInput v-model="addForm.name" class="w-full" placeholder="Full name" :disabled="isLocked" />
            </UFormField>

            <UFormField label="Role" name="role" required>
              <USelectMenu
                v-model="addForm.role"
                class="w-full"
                :items="practiceRoleOptions"
                value-key="value"
                label-key="label"
                :search-input="false"
                :disabled="isLocked"
              />
            </UFormField>

            <PortalTemporaryPasswordReveal :password="temporaryPassword" @copy="copyTemporaryPassword" />

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
                    resetAddForm();
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
                    resetAddForm();
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

      <UForm
        v-else
        :schema="editSchema"
        :state="editForm"
        @submit="(event: FormSubmitEvent<EditSchema>) => onEditSubmit(event)"
      >
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
              <UInput v-model="editForm.name" class="w-full" placeholder="Full name" :disabled="isLocked" />
            </UFormField>

            <UFormField label="Email" name="email" required>
              <UInput
                v-model="editForm.email"
                class="w-full"
                type="email"
                placeholder="staff@practice.com"
                :disabled="isLocked"
              />
            </UFormField>

            <UFormField label="Role" name="role" required>
              <USelectMenu
                v-model="editForm.role"
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
                :disabled="isSelf || isLocked || isSubmitting"
                @click="resetPassword"
              >
                Reset password
              </UButton>
              <p class="mt-2 text-xs text-muted">
                Generates a new temporary password and forces the user to change it on next login.
              </p>
            </div>

            <PortalTemporaryPasswordReveal :password="temporaryPassword" @copy="copyTemporaryPassword" />

            <UAlert v-if="error" color="error" variant="soft" :title="error" />
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton v-if="temporaryPassword" color="primary" @click="close">
                I copied the password, continue
              </UButton>
              <template v-else>
                <UButton type="button" color="neutral" variant="ghost" @click="close">Cancel</UButton>
                <UButton :loading="isSubmitting" :disabled="isResetting" type="submit">Save changes</UButton>
              </template>
            </div>
          </template>
        </UCard>
      </UForm>
    </template>
  </UModal>
</template>
