<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { User } from '~~/server/types/user';
import { roleOptions } from '~~/shared/utils/users';
import { useTemporaryPassword } from '~~/app/composables/useTemporaryPassword';
import { getErrorMessage } from '~~/app/utils/errors';

const props = defineProps<{ user?: User }>();
const emit = defineEmits<{ success: []; close: [] }>();

const isEdit = computed(() => Boolean(props.user));

const { user: currentUser } = useUserSession();
const isSelf = computed(() => isEdit.value && props.user?.id === currentUser.value?.id);

const addSchema = z.object({
  email: z.email('Invalid email'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['USER', 'ADMIN']),
  useSso: z.boolean(),
});
const editSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email'),
  role: z.enum(['ADMIN', 'USER']),
});

type AddSchema = z.output<typeof addSchema>;
type EditSchema = z.output<typeof editSchema>;

const addForm = reactive<AddSchema>({ email: '', name: '', role: 'USER', useSso: true });
const editForm = reactive<EditSchema>({
  name: props.user?.name ?? '',
  email: props.user?.email ?? '',
  role: (props.user?.role as 'ADMIN' | 'USER') ?? 'USER',
});

const ldaRoleOptions = roleOptions.filter((opt) => opt.value === 'USER' || opt.value === 'ADMIN');

const isOpen = ref(false);
const isSubmitting = ref(false);
const isResetting = ref(false);
const error = ref('');
const toast = useToast();

const { temporaryPassword, isLocked, copyTemporaryPassword, reset: resetTempPassword } = useTemporaryPassword();

const open = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
  error.value = '';
  resetTempPassword();
  emit('close');
};

const resetAddForm = () => {
  addForm.email = '';
  addForm.name = '';
  addForm.role = 'USER';
  addForm.useSso = true;
  error.value = '';
  resetTempPassword();
};

const onAddSubmit = async (event: FormSubmitEvent<AddSchema>) => {
  if (isLocked.value) return;
  isSubmitting.value = true;
  error.value = '';
  resetTempPassword();

  try {
    const res = await $fetch<{ user: unknown; temporaryPassword: string | null }>('/api/admin/users', {
      method: 'POST',
      body: event.data,
    });
    temporaryPassword.value = res.temporaryPassword;
    toast.add({ description: 'Staff member added successfully', color: 'success' });

    if (!temporaryPassword.value) {
      resetAddForm();
      emit('success');
      close();
    } else {
      emit('success');
    }
  } catch (e: unknown) {
    error.value = getErrorMessage(e, 'Failed to add staff member');
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};

const onEditSubmit = async (_event: FormSubmitEvent<EditSchema>) => {
  if (isLocked.value || !props.user) return;
  isSubmitting.value = true;
  error.value = '';

  try {
    await $fetch(`/api/admin/users/${props.user.id}`, { method: 'PATCH', body: editForm });
    toast.add({ description: 'User updated', color: 'success' });
    emit('success');
    close();
  } catch (e: unknown) {
    error.value = getErrorMessage(e, 'Failed to update user');
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};

const resetPassword = async () => {
  if (!props.user || isSelf.value) return;
  const confirmed = confirm(
    `Reset password for ${props.user.email}? They will be forced to set a new password on next login.`
  );
  if (!confirmed) return;

  isResetting.value = true;
  error.value = '';

  try {
    const res = await $fetch<{ temporaryPassword: string }>(`/api/admin/users/${props.user.id}/reset-password`, {
      method: 'POST',
    });
    temporaryPassword.value = res.temporaryPassword;
    toast.add({ description: 'Password reset — share the temp password securely', color: 'success' });
    emit('success');
  } catch (e: unknown) {
    error.value = getErrorMessage(e, 'Failed to reset password');
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isResetting.value = false;
  }
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
            <h3 class="text-lg font-semibold">Add LDA Staff</h3>
          </template>

          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Add a new LDA staff member. They can sign in with Microsoft SSO or be given a temporary password.
            </p>

            <UFormField label="Email" name="email" required>
              <UInput
                v-model="addForm.email"
                class="w-full"
                type="email"
                placeholder="user@example.com"
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
                :items="ldaRoleOptions"
                value-key="value"
                label-key="label"
                :search-input="false"
                :disabled="isLocked"
              />
            </UFormField>

            <UFormField label="Authentication" name="useSso">
              <UCheckbox
                v-model="addForm.useSso"
                label="Use Microsoft SSO (no password)"
                description="If unchecked, a temporary password will be generated and the user will be forced to change it on first login."
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
            <h3 class="text-lg font-semibold">Edit LDA Staff</h3>
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
                placeholder="user@example.com"
                :disabled="isLocked"
              />
            </UFormField>

            <UFormField label="Role" name="role" required>
              <USelectMenu
                v-model="editForm.role"
                class="w-full"
                :items="ldaRoleOptions"
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
