<script setup lang="ts">
import type { CaseFile, CaseTypeFileSlot } from '~~/shared/types/case';
import { getFileExtension, getFileTypeMeta, isImageExtension, isPdfExtension } from '~~/app/utils/fileTypes';

interface CaseEventLite {
  type: string;
  message?: string | null;
}

const props = withDefaults(
  defineProps<{
    caseId: string;
    files: CaseFile[];
    fileSlots: CaseTypeFileSlot[];
    events?: CaseEventLite[];
  }>(),
  { events: () => [] }
);

const slotLabel = (slotId: string) => props.fileSlots.find((s) => s.id === slotId)?.label || slotId;

const fileUrl = (file: CaseFile) => {
  const path = file.path ?? `${file.slotId}/${file.fileName}`;
  return `/api/cases/${props.caseId}/files/${path}`;
};

const downloadUrl = (file: CaseFile) => `${fileUrl(file)}?download=1`;

const wasDownloaded = (file: CaseFile) =>
  props.events.some((e) => e.type === 'FILE_DOWNLOADED' && e.message === file.fileName);

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isPdf = (file: CaseFile) => isPdfExtension(getFileExtension(file.fileName));
const isImage = (file: CaseFile) => isImageExtension(getFileExtension(file.fileName));
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
          <UIcon
            :name="getFileTypeMeta(file.fileName).icon"
            :class="['h-5 w-5', getFileTypeMeta(file.fileName).colorClass]"
          />
          <div>
            <div class="flex items-center gap-2">
              <p class="font-medium">{{ file.fileName }}</p>
              <UBadge
                v-if="wasDownloaded(file)"
                color="success"
                variant="subtle"
                size="xs"
                icon="i-ri-download-line"
                label="Downloaded"
              />
            </div>
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
          <UButton :to="downloadUrl(file)" external download variant="ghost" size="sm" icon="i-ri-download-line">
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
