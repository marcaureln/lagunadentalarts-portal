<script setup lang="ts">
import type { User } from '~~/shared/utils/users';

const props = defineProps<{ user: User }>();

const emit = defineEmits<{
  success: [];
}>();

const deleteUser = async () => {
  try {
    await $fetch(`/api/admin/users/${props.user.id}`, {
      method: 'DELETE',
    });
    emit('success');
  } catch (e) {
    console.error('Failed to delete user', e);
  }
};
</script>

<template>
  <UModal>
    <UButton color="error" variant="ghost" size="sm" icon="i-ri-delete-bin-line"> Delete </UButton>

    <template #content="{ close }">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <UIcon name="i-ri-error-warning-line" class="h-6 w-6 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold">Delete User</h3>
          </div>
        </template>

        <p class="text-sm text-gray-600">
          Are you sure you want to delete <strong>{{ user.email }}</strong
          >? They will no longer be able to sign in.
        </p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="close"> Cancel </UButton>
            <UButton color="error" @click="deleteUser"> Delete </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
