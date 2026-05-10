<script setup lang="ts">
import type { User } from '~~/shared/utils/users';

const props = defineProps<{
  user: User;
  practiceId: string;
}>();

const emit = defineEmits<{
  success: [];
}>();

const toast = useToast();

const deleteUser = async () => {
  try {
    await $fetch(`/api/practices/${props.practiceId}/users/${props.user.id}`, { method: 'DELETE' });
    toast.add({ description: 'Staff member removed', color: 'success' });
    emit('success');
  } catch (e) {
    console.error('Failed to remove staff', e);
    toast.add({ description: 'Failed to remove staff', color: 'error' });
  }
};
</script>

<template>
  <UModal>
    <UButton color="error" variant="ghost" size="sm" icon="i-ri-delete-bin-line"> Remove </UButton>

    <template #content="{ close }">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <UIcon name="i-ri-error-warning-line" class="h-6 w-6 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold">Remove Staff</h3>
          </div>
        </template>

        <p class="text-sm text-gray-600">
          Remove <strong>{{ user.email }}</strong> from this practice? They will no longer be able to sign in.
        </p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="close"> Cancel </UButton>
            <UButton
              color="error"
              @click="
                deleteUser();
                close();
              "
            >
              Remove
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
