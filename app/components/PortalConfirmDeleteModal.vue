<script setup lang="ts">
const props = defineProps<{
  endpoint: string;
  title: string;
  triggerLabel: string;
  confirmLabel: string;
  successMsg: string;
  failureMsg: string;
}>();

const emit = defineEmits<{ success: [] }>();

const { mutate, isLoading: isDeleting } = useApiMutation();

const onConfirm = async (close: () => void) => {
  const result = await mutate(
    props.endpoint,
    { method: 'DELETE' },
    { successMessage: props.successMsg, errorMessage: props.failureMsg }
  );
  if (result !== null) {
    emit('success');
    close();
  }
};
</script>

<template>
  <UModal>
    <UButton color="error" variant="ghost" size="sm" icon="i-ri-delete-bin-line">{{ triggerLabel }}</UButton>

    <template #content="{ close }">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <UIcon name="i-ri-error-warning-line" class="h-6 w-6 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold">{{ title }}</h3>
          </div>
        </template>

        <p class="text-sm text-gray-600">
          <slot />
        </p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
            <UButton color="error" :loading="isDeleting" @click="onConfirm(close)">{{ confirmLabel }}</UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
