<script setup lang="ts">
import type { Practice, PracticeCreateInput } from '~~/shared/types/practice';
import { getErrorMessage } from '~~/app/utils/errors';

const props = defineProps<{ practice?: Practice }>();
const emit = defineEmits<{ success: []; close: [] }>();

const isEdit = computed(() => Boolean(props.practice));

const state = reactive<PracticeCreateInput>({
  name: props.practice?.name ?? '',
  address: props.practice?.address ?? '',
  phone: props.practice?.phone ?? '',
  email: props.practice?.email ?? '',
});

const isOpen = ref(false);
const isSubmitting = ref(false);
const error = ref('');
const toast = useToast();

const open = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
  error.value = '';
  emit('close');
};

const resetForm = () => {
  state.name = '';
  state.address = '';
  state.phone = '';
  state.email = '';
  error.value = '';
};

const submit = async () => {
  isSubmitting.value = true;
  error.value = '';

  try {
    if (isEdit.value && props.practice) {
      await $fetch(`/api/practices/${props.practice.id}`, { method: 'PUT', body: state });
      toast.add({ title: 'Success', description: 'Practice updated successfully', color: 'success' });
    } else {
      await $fetch('/api/practices', { method: 'POST', body: state });
      toast.add({ title: 'Success', description: 'Practice created successfully', color: 'success' });
      resetForm();
    }
    emit('success');
    close();
  } catch (e: unknown) {
    error.value = getErrorMessage(e, isEdit.value ? 'Failed to update practice' : 'Failed to create practice');
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};

defineExpose({ open });
</script>

<template>
  <UModal v-model:open="isOpen">
    <UTooltip v-if="isEdit" text="Edit">
      <UButton variant="ghost" color="neutral" icon="i-ri-edit-line" size="sm" />
    </UTooltip>
    <UButton v-else color="primary">
      <UIcon name="i-ri-add-line" class="mr-2 h-4 w-4" />
      Add Practice
    </UButton>

    <template #content>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ isEdit ? 'Edit Practice' : 'Add New Practice' }}</h3>
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
            <UButton :loading="isSubmitting" @click="submit">
              {{ isEdit ? 'Update Practice' : 'Create Practice' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
