<script setup lang="ts">
import { roleOptions, type UserRole } from '~~/shared/utils/users';

const emit = defineEmits<{
  success: [];
}>();

const newUser = reactive({
  email: '',
  role: 'PRACTICESTAFF' as UserRole,
});

const isSubmitting = ref(false);
const error = ref('');

const resetForm = () => {
  newUser.email = '';
  newUser.role = 'PRACTICESTAFF';
  error.value = '';
};

const addUser = async () => {
  isSubmitting.value = true;
  error.value = '';
  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: newUser,
    });
    resetForm();
    emit('success');
  } catch (e: unknown) {
    error.value = 'Failed to add user';
    console.error('Failed to add user', e);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <UModal>
    <UButton icon="i-ri-user-add-line"> Add User </UButton>

    <template #content="{ close }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Add Allowed User</h3>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-600">
            Add a new user to the allowlist. They will be able to sign in with their Microsoft account.
          </p>

          <div>
            <label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email *</label>
            <UInput id="email" v-model="newUser.email" type="email" placeholder="user@example.com" />
          </div>

          <div>
            <label for="role" class="mb-1 block text-sm font-medium text-gray-700">Role *</label>
            <USelectMenu
              id="role"
              v-model="newUser.role"
              :items="roleOptions"
              value-key="value"
              :search-input="false"
            />
          </div>

          <UAlert v-if="error" color="error" variant="soft" :title="error" />
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="close"> Cancel </UButton>
            <UButton :loading="isSubmitting" @click="addUser"> Add User </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
