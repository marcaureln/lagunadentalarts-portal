<script setup lang="ts">
const emit = defineEmits<{
  success: [];
}>();

const file = ref<File | null>(null);
const title = ref('');
const description = ref('');
const sortOrder = ref(0);

const isSubmitting = ref(false);
const error = ref('');
const toast = useToast();

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT =
  '.pdf,.png,.jpg,.jpeg,.docx,.xlsx,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const reset = () => {
  file.value = null;
  title.value = '';
  description.value = '';
  sortOrder.value = 0;
  error.value = '';
};

const submit = async () => {
  if (!file.value) {
    error.value = 'Please choose a file';
    return;
  }
  if (file.value.size > MAX_BYTES) {
    error.value = 'File exceeds the 25 MB limit';
    return;
  }
  if (!title.value.trim()) {
    error.value = 'Title is required';
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    const body = new FormData();
    body.append('file', file.value);
    body.append('title', title.value.trim());
    if (description.value.trim()) body.append('description', description.value.trim());
    body.append('sortOrder', String(sortOrder.value));

    await $fetch('/api/admin/resources', { method: 'POST', body });

    toast.add({ title: 'Resource added', color: 'success' });
    reset();
    emit('success');
  } catch (e: unknown) {
    const err = e as { statusMessage?: string; data?: { statusMessage?: string } };
    error.value = err.statusMessage || err.data?.statusMessage || 'Failed to upload resource';
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <UModal>
    <UButton color="primary" icon="i-ri-add-line"> Add Resource </UButton>

    <template #content="{ close }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Add Resource</h3>
        </template>

        <div class="space-y-4">
          <UFormField label="File *" description="PDF, PNG, JPG, DOCX or XLSX. Max 25 MB.">
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

          <UFormField label="Sort order" description="Lower numbers appear first.">
            <UInput v-model.number="sortOrder" type="number" class="w-full" />
          </UFormField>

          <UAlert v-if="error" color="error" variant="soft" :title="error" />
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="isSubmitting" @click="close">Cancel</UButton>
            <UButton
              :loading="isSubmitting"
              @click="
                async () => {
                  await submit();
                  if (!error) close();
                }
              "
            >
              Upload
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
