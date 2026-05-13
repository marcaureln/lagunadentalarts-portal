<script setup lang="ts">
import type { CaseFile, CaseTypeFileSlot } from '~~/shared/types/case';

const props = defineProps<{
  caseId: string;
  files: CaseFile[];
  fileSlots: CaseTypeFileSlot[];
}>();

const slotLabel = (slotId: string) => props.fileSlots.find((s) => s.id === slotId)?.label || slotId;

const fileUrl = (file: CaseFile) => {
  const path = file.path ?? `${file.slotId}/${file.fileName}`;
  return `/api/cases/${props.caseId}/files/${path}`;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const PDF_EXTENSIONS = ['pdf'];
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'];

const fileExtension = (file: CaseFile) => file.fileName.toLowerCase().split('.').pop() ?? '';
const isPdf = (file: CaseFile) => PDF_EXTENSIONS.includes(fileExtension(file));
const isImage = (file: CaseFile) => IMAGE_EXTENSIONS.includes(fileExtension(file));
const isPreviewable = (file: CaseFile) => isPdf(file) || isImage(file);

const previewFile = ref<CaseFile | null>(null);
const isPreviewOpen = computed({
  get: () => !!previewFile.value,
  set: (v) => {
    if (!v) previewFile.value = null;
  },
});

const openPreview = (file: CaseFile) => {
  previewFile.value = file;
};
</script>

<template>
  <UCard :ui="{ body: 'py-0!' }">
    <template #header>
      <h3 class="font-semibold">Uploaded Files</h3>
    </template>
    <ul class="divide-y divide-gray-200 dark:divide-gray-700">
      <li v-for="file in files" :key="file.slotId" class="flex items-center justify-between py-3">
        <div class="flex items-center gap-3">
          <UIcon name="i-ri-file-line" class="h-5 w-5 text-muted" />
          <div>
            <p class="font-medium">{{ file.fileName }}</p>
            <p class="text-xs text-muted">
              {{ slotLabel(file.slotId) }}
              <span v-if="file.fileSize"> · {{ formatFileSize(file.fileSize) }}</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <UButton v-if="isPreviewable(file)" variant="ghost" size="sm" icon="i-ri-eye-line" @click="openPreview(file)">
            Preview
          </UButton>
          <UButton :to="fileUrl(file)" external download variant="ghost" size="sm" icon="i-ri-download-line">
            Download
          </UButton>
        </div>
      </li>
    </ul>

    <UModal v-model:open="isPreviewOpen" :title="previewFile?.fileName ?? 'Preview'" :ui="{ content: 'sm:max-w-4xl' }">
      <template #body>
        <iframe
          v-if="previewFile && isPdf(previewFile)"
          :src="fileUrl(previewFile)"
          class="h-[80vh] w-full rounded-md border border-default"
        />
        <img
          v-else-if="previewFile && isImage(previewFile)"
          :src="fileUrl(previewFile)"
          :alt="previewFile.fileName"
          class="mx-auto max-h-[80vh]"
        />
      </template>
    </UModal>
  </UCard>
</template>
