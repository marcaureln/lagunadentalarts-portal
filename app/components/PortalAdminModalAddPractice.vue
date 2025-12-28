<script setup lang="ts">
import type { PracticeCreateInput } from '~~/shared/types/practice';

const emit = defineEmits<{
  success: [];
}>();

const state = reactive<PracticeCreateInput>({
  name: '',
  address: '',
  phone: '',
  email: '',
});

const isSubmitting = ref(false);
const error = ref('');
const toast = useToast();

const resetForm = () => {
  state.name = '';
  state.address = '';
  state.phone = '';
  state.email = '';
  error.value = '';
};

const addPractice = async () => {
  isSubmitting.value = true;
  error.value = '';

  try {
    await $fetch('/api/practices', {
      method: 'POST',
      body: state,
    });

    toast.add({
      title: 'Success',
      description: 'Practice created successfully',
      color: 'success',
    });

    resetForm();
    emit('success');
  } catch (e: unknown) {
    error.value = 'Failed to create practice';
    console.error('Failed to create practice', e);
    toast.add({
      description: 'Failed to create practice',
      color: 'error',
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <UModal>
    <UButton color="primary">
      <UIcon name="i-ri-add-line" class="mr-2 h-4 w-4" />
      Add Practice
    </UButton>

    <template #content="{ close }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Add New Practice</h3>
        </template>

        <div class="space-y-4">
          <div>
            <label for="name" class="mb-1 block text-sm font-medium text-gray-700">Practice Name *</label>
            <UInput id="name" v-model="state.name" placeholder="Enter practice name" required />
          </div>

          <div>
            <label for="address" class="mb-1 block text-sm font-medium text-gray-700">Address</label>
            <UTextarea id="address" v-model="state.address" placeholder="Enter practice address" :rows="3" />
          </div>

          <div>
            <label for="phone" class="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <UInput id="phone" v-model="state.phone" placeholder="Enter phone number" />
          </div>

          <div>
            <label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <UInput id="email" v-model="state.email" type="email" placeholder="Enter email address" />
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
                  await addPractice();
                  if (!error) close();
                }
              "
            >
              Create Practice
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
