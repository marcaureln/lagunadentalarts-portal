<script setup lang="ts">
interface ResourceLite {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
}

const props = defineProps<{
  resource: ResourceLite;
}>();

const emit = defineEmits<{
  success: [];
}>();

const isOpen = ref(false);

const title = ref(props.resource.title);
const description = ref(props.resource.description ?? '');
const sortOrder = ref(props.resource.sortOrder);

const isSubmitting = ref(false);
const error = ref('');
const toast = useToast();

const syncFromProps = () => {
  title.value = props.resource.title;
  description.value = props.resource.description ?? '';
  sortOrder.value = props.resource.sortOrder;
  error.value = '';
};

watch(() => props.resource, syncFromProps);

const open = () => {
  syncFromProps();
  isOpen.value = true;
};

defineExpose({ open });

const submit = async () => {
  if (!title.value.trim()) {
    error.value = 'Title is required';
    return;
  }
  isSubmitting.value = true;
  error.value = '';
  try {
    await $fetch(`/api/admin/resources/${props.resource.id}`, {
      method: 'PATCH',
      body: {
        title: title.value.trim(),
        description: description.value.trim() ? description.value.trim() : null,
        sortOrder: Number.isFinite(sortOrder.value) ? sortOrder.value : 0,
      },
    });
    toast.add({ title: 'Resource updated', color: 'success' });
    isOpen.value = false;
    emit('success');
  } catch (e: unknown) {
    const err = e as { statusMessage?: string; data?: { statusMessage?: string } };
    error.value = err.statusMessage || err.data?.statusMessage || 'Failed to update resource';
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <UModal v-model:open="isOpen" title="Edit Resource" :ui="{ content: 'sm:max-w-lg' }">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Title *">
          <UInput v-model="title" class="w-full" />
        </UFormField>

        <UFormField label="Description">
          <UTextarea v-model="description" class="w-full" :rows="3" />
        </UFormField>

        <UFormField label="Sort order" description="Lower numbers appear first.">
          <UInput v-model.number="sortOrder" type="number" class="w-full" />
        </UFormField>

        <UAlert v-if="error" color="error" variant="soft" :title="error" />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="ghost" :disabled="isSubmitting" @click="isOpen = false">Cancel</UButton>
        <UButton :loading="isSubmitting" @click="submit">Save</UButton>
      </div>
    </template>
  </UModal>
</template>
