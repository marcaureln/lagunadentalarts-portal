<script setup lang="ts">
interface ResourceLite {
  id: string;
  title: string;
  description: string | null;
}

const props = defineProps<{
  resource?: ResourceLite;
}>();

const emit = defineEmits<{
  success: [];
}>();

const isOpen = ref(false);
const isEdit = computed(() => !!props.resource);

const file = ref<File | null>(null);
const title = ref('');
const description = ref('');

const isSubmitting = ref(false);
const error = ref('');
const toast = useToast();

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT =
  '.pdf,.png,.jpg,.jpeg,.docx,.xlsx,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const syncFromProps = () => {
  if (props.resource) {
    title.value = props.resource.title;
    description.value = props.resource.description ?? '';
  } else {
    title.value = '';
    description.value = '';
  }
  file.value = null;
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
    if (isEdit.value && props.resource) {
      await $fetch(`/api/admin/resources/${props.resource.id}`, {
        method: 'PATCH',
        body: {
          title: title.value.trim(),
          description: description.value.trim() ? description.value.trim() : null,
        },
      });
      toast.add({ title: 'Resource updated', color: 'success' });
    } else {
      if (!file.value) {
        error.value = 'Please choose a file';
        return;
      }
      if (file.value.size > MAX_BYTES) {
        error.value = 'File exceeds the 25 MB limit';
        return;
      }
      const body = new FormData();
      body.append('file', file.value);
      body.append('title', title.value.trim());
      if (description.value.trim()) body.append('description', description.value.trim());
      await $fetch('/api/admin/resources', { method: 'POST', body });
      toast.add({ title: 'Resource added', color: 'success' });
    }

    isOpen.value = false;
    emit('success');
  } catch (e: unknown) {
    const err = e as { statusMessage?: string; data?: { statusMessage?: string } };
    error.value = err.statusMessage || err.data?.statusMessage || 'Failed to save resource';
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <UModal v-model:open="isOpen" :title="isEdit ? 'Edit Resource' : 'Add Resource'" :ui="{ content: 'sm:max-w-lg' }">
    <template #body>
      <div class="space-y-4">
        <UFormField v-if="!isEdit" label="File *" description="PDF, PNG, JPG, DOCX or XLSX. Max 25 MB.">
          <UFileUpload
            v-model="file"
            position="inside"
            layout="list"
            :accept="ACCEPT"
            icon="i-ri-upload-cloud-2-line"
            label="Drop file here"
            description="Click or drag to upload"
            class="min-h-32"
          />
        </UFormField>

        <UFormField label="Title *">
          <UInput v-model="title" class="w-full" placeholder="e.g. Lab Slip" />
        </UFormField>

        <UFormField label="Description">
          <UTextarea v-model="description" class="w-full" placeholder="Optional context for the form" :rows="3" />
        </UFormField>

        <UAlert v-if="error" color="error" variant="soft" :title="error" />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="ghost" :disabled="isSubmitting" @click="isOpen = false">Cancel</UButton>
        <UButton :loading="isSubmitting" @click="submit">{{ isEdit ? 'Save' : 'Upload' }}</UButton>
      </div>
    </template>
  </UModal>
</template>
