<script setup lang="ts">
import type { CaseFile, CaseType } from '~~/shared/types/case';

defineProps<{
  patientName: string;
  patientExternalId: string;
  caseType: CaseType | null;
  labSlipData: Record<string, string>;
  uploadedFiles: CaseFile[];
  error: string;
  isSavingDraft: boolean;
  isSubmittingCase: boolean;
  step1Valid: boolean;
  isUploading: boolean;
  uploadCurrentFileName: string | null;
  uploadOverallProgress: number;
}>();

const consentChecked = defineModel<boolean>('consentChecked', { required: true });

const emit = defineEmits<{
  cancel: [];
  back: [];
  saveDraft: [];
  submit: [];
}>();

const canSubmit = computed(() => consentChecked.value);

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">Review your case details before submitting.</p>

    <div class="space-y-4">
      <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <h4 class="mb-2 font-medium">Patient Information</h4>
        <dl class="grid grid-cols-2 gap-2 text-sm">
          <dt class="text-muted">Name:</dt>
          <dd>{{ patientName }}</dd>
          <dt class="text-muted">External ID:</dt>
          <dd>{{ patientExternalId || '-' }}</dd>
        </dl>
      </div>

      <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <h4 class="mb-2 font-medium">Case Type</h4>
        <p>{{ caseType?.label }}</p>
      </div>

      <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <h4 class="mb-2 font-medium">Lab Slip Details</h4>
        <dl class="grid grid-cols-2 gap-2 text-sm">
          <template v-for="field in caseType?.fields" :key="field.id">
            <dt class="text-muted">{{ field.label }}:</dt>
            <dd>{{ labSlipData[field.id] || '-' }}</dd>
          </template>
        </dl>
      </div>

      <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <h4 class="mb-2 font-medium">Uploaded Files</h4>
        <ul class="space-y-1 text-sm">
          <li v-for="file in uploadedFiles" :key="file.slotId" class="flex items-center gap-2">
            <UIcon name="i-ri-file-line" class="h-4 w-4 text-gray-500" />
            <span>{{ file.fileName }}</span>
            <span class="text-xs text-muted">({{ formatFileSize(file.fileSize) }})</span>
          </li>
          <li v-if="uploadedFiles.length === 0" class="text-muted">No files uploaded</li>
        </ul>
      </div>

      <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <UCheckbox
          v-model="consentChecked"
          label="I confirm that all information is accurate"
          description="By submitting this case, I acknowledge that the case will be processed and charges may apply. This action cannot be undone."
        />
      </div>
    </div>

    <div v-if="isUploading" class="rounded-md border border-default bg-elevated/40 px-3 py-2">
      <div class="mb-1 flex items-center justify-between text-xs text-muted">
        <span class="truncate">Uploading {{ uploadCurrentFileName ?? 'files' }}…</span>
        <span class="ml-2 shrink-0 tabular-nums">{{ Math.round(uploadOverallProgress * 100) }}%</span>
      </div>
      <UProgress :model-value="Math.round(uploadOverallProgress * 100)" size="sm" />
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" />

    <div class="mt-6 flex justify-between">
      <div class="flex gap-2">
        <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">Cancel</UButton>
        <UButton type="button" color="neutral" variant="ghost" @click="emit('back')">Back</UButton>
      </div>
      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :loading="isSavingDraft"
          :disabled="isSubmittingCase || !step1Valid"
          @click="emit('saveDraft')"
        >
          Save Draft
        </UButton>
        <UButton
          color="primary"
          :loading="isSubmittingCase"
          :disabled="isSavingDraft || !canSubmit"
          @click="emit('submit')"
        >
          Submit Case
        </UButton>
      </div>
    </div>
  </div>
</template>
