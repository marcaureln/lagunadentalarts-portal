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
</script>

<template>
  <UCard>
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
        <UButton :to="fileUrl(file)" external download variant="ghost" size="sm" icon="i-ri-download-line">
          Download
        </UButton>
      </li>
    </ul>
  </UCard>
</template>
