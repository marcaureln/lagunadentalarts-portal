<script setup lang="ts">
import type { CaseFile, CaseType } from '~~/shared/types/case';
import { LAB_SLIP_SLOT_ID } from '~~/shared/utils/caseTypes';

const props = defineProps<{
  caseType: CaseType | null;
  uploadedFiles: CaseFile[];
  error: string;
  isSavingDraft: boolean;
  isSubmittingCase: boolean;
  step1Valid: boolean;
  isUploading: boolean;
  uploadCurrentFileName: string | null;
  uploadOverallProgress: number;
}>();

const visibleFileSlots = computed(() => (props.caseType?.fileSlots ?? []).filter((s) => s.id !== LAB_SLIP_SLOT_ID));

const slotFiles = defineModel<Record<string, File | undefined>>('slotFiles', { required: true });

const emit = defineEmits<{
  cancel: [];
  back: [];
  saveDraft: [];
  next: [];
  fileSelected: [slotId: string, file: File];
}>();

const requiredFilesMissing = computed(() =>
  visibleFileSlots.value
    .filter((s) => s.required)
    .filter((s) => !props.uploadedFiles.some((f) => f.slotId === s.id))
    .map((s) => s.label)
);

const canProceed = computed(() => requiredFilesMissing.value.length === 0);
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">Upload the required files for this case.</p>

    <div v-if="caseType" class="space-y-4">
      <div v-for="slot in visibleFileSlots" :key="slot.id">
        <UFormField
          :label="`${slot.label}${slot.required ? ' *' : ''}`"
          :description="slot.accept ? `Accepted: ${slot.accept}` : undefined"
        >
          <UFileUpload
            v-model="slotFiles[slot.id]"
            position="inside"
            layout="list"
            :accept="slot.accept"
            icon="i-ri-upload-cloud-2-line"
            :label="`Drop ${slot.label.toLowerCase()} here`"
            description="Click or drag to upload"
            class="min-h-32"
            @update:model-value="(file: File | null | undefined) => file && emit('fileSelected', slot.id, file)"
          />
        </UFormField>
      </div>
    </div>

    <div v-if="isUploading" class="rounded-md border border-default bg-elevated/40 px-3 py-2">
      <div class="mb-1 flex items-center justify-between text-xs text-muted">
        <span class="truncate">Uploading {{ uploadCurrentFileName ?? 'files' }}…</span>
        <span class="ml-2 shrink-0 tabular-nums">{{ Math.round(uploadOverallProgress * 100) }}%</span>
      </div>
      <UProgress :model-value="Math.round(uploadOverallProgress * 100)" size="sm" />
    </div>

    <UAlert
      v-if="requiredFilesMissing.length > 0"
      color="warning"
      variant="soft"
      icon="i-ri-error-warning-line"
      :title="`Missing required files: ${requiredFilesMissing.join(', ')}`"
    />

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
        <UButton :disabled="!canProceed" @click="emit('next')">Next</UButton>
      </div>
    </div>
  </div>
</template>
