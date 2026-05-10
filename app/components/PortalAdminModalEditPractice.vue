<script setup lang="ts">
import type { Practice, PracticeUpdateInput } from '~~/shared/types/practice';

const props = defineProps<{
  practice: Practice;
}>();

const emit = defineEmits<{
  success: [];
}>();

const state = reactive<PracticeUpdateInput>({
  name: props.practice.name,
  address: props.practice.address || '',
  phone: props.practice.phone || '',
  email: props.practice.email || '',
});

const isSubmitting = ref(false);
const error = ref('');
const toast = useToast();

const updatePractice = async () => {
  isSubmitting.value = true;
  error.value = '';

  try {
    await $fetch(`/api/practices/${props.practice.id}`, {
      method: 'PUT',
      body: state,
    });

    toast.add({
      title: 'Success',
      description: 'Practice updated successfully',
      color: 'success',
    });

    emit('success');
  } catch (e: unknown) {
    error.value = 'Failed to update practice';
    console.error('Failed to update practice', e);
    toast.add({
      description: 'Failed to update practice',
      color: 'error',
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <UModal>
    <UTooltip text="Edit">
      <UButton variant="ghost" color="neutral" icon="i-ri-edit-line" size="sm" />
    </UTooltip>

    <template #content="{ close }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Edit Practice</h3>
        </template>

        <div class="space-y-4">
          <div>
            <label for="name" class="mb-1 block text-sm font-medium text-gray-700">Practice Name *</label>
            <UInput id="name" v-model="state.name" class="w-full" placeholder="Enter practice name" required />
          </div>

          <div>
            <label for="address" class="mb-1 block text-sm font-medium text-gray-700">Address</label>
            <UTextarea
              id="address"
              v-model="state.address"
              class="w-full"
              placeholder="Enter practice address"
              :rows="3"
            />
          </div>

          <div>
            <label for="phone" class="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <UInput id="phone" v-model="state.phone" class="w-full" placeholder="Enter phone number" />
          </div>

          <div>
            <label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <UInput id="email" v-model="state.email" class="w-full" type="email" placeholder="Enter email address" />
          </div>

          <UAlert v-if="error" color="error" variant="soft" :title="error" />
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
            <UButton
              :loading="isSubmitting"
              @click="
                async () => {
                  await updatePractice();
                  if (!error) close();
                }
              "
            >
              Update Practice
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
