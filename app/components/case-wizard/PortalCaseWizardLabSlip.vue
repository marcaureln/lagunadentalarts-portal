<script setup lang="ts">
import type { CaseFile, CaseType } from '~~/shared/types/case';
import { LAB_SLIP_SLOT_ID, SLIP_MODE_KEY, supportsSlipUpload, type SlipMode } from '~~/shared/utils/caseTypes';

const props = defineProps<{
  caseType: CaseType | null;
  error: string;
  isSavingDraft: boolean;
  isSubmittingCase: boolean;
  step1Valid: boolean;
  uploadedFiles: CaseFile[];
}>();

const labSlipData = defineModel<Record<string, string>>('labSlipData', { required: true });
const slotFiles = defineModel<Record<string, File | undefined>>('slotFiles', { required: true });

const emit = defineEmits<{
  cancel: [];
  back: [];
  saveDraft: [];
  next: [];
  fileSelected: [slotId: string, file: File];
}>();

const isSlipUploadCaseType = computed(() => !!props.caseType && supportsSlipUpload(props.caseType.key));

const slipMode = computed<SlipMode>(() => (labSlipData.value[SLIP_MODE_KEY] === 'UPLOAD' ? 'UPLOAD' : 'FORM'));

const setSlipMode = (mode: SlipMode) => {
  labSlipData.value = { ...labSlipData.value, [SLIP_MODE_KEY]: mode };
};

const slipModeOptions: { value: SlipMode; label: string }[] = [
  { value: 'FORM', label: 'Fill out form online' },
  { value: 'UPLOAD', label: 'Upload scanned slip' },
];

const labSlipSlot = computed(() => props.caseType?.fileSlots.find((s) => s.id === LAB_SLIP_SLOT_ID));
const uploadedLabSlip = computed(() => props.uploadedFiles.find((f) => f.slotId === LAB_SLIP_SLOT_ID));
const pendingLabSlip = computed(() => slotFiles.value[LAB_SLIP_SLOT_ID]);
const hasLabSlipFile = computed(() => !!uploadedLabSlip.value || !!pendingLabSlip.value);

const requiredFieldsMissing = computed(() => {
  if (!props.caseType) return [];
  return props.caseType.fields
    .filter((f) => f.required)
    .filter((f) => {
      const val = labSlipData.value[f.id];
      return val === undefined || val === null || val === '';
    })
    .map((f) => f.label);
});

const showFormFields = computed(() => !(isSlipUploadCaseType.value && slipMode.value === 'UPLOAD'));

const canProceed = computed(() => {
  if (isSlipUploadCaseType.value && slipMode.value === 'UPLOAD') {
    return hasLabSlipFile.value;
  }
  return requiredFieldsMissing.value.length === 0;
});
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">Fill in the clinical details for this case.</p>

    <div v-if="isSlipUploadCaseType" class="rounded-md border border-default p-4">
      <p class="mb-2 text-sm font-medium">How would you like to provide the lab slip?</p>
      <div class="flex flex-col gap-2">
        <label v-for="opt in slipModeOptions" :key="opt.value" class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="slipMode"
            :value="opt.value"
            :checked="slipMode === opt.value"
            class="accent-primary"
            @change="setSlipMode(opt.value)"
          />
          <span>{{ opt.label }}</span>
        </label>
      </div>
    </div>

    <div v-if="isSlipUploadCaseType && slipMode === 'UPLOAD'" class="space-y-2">
      <UFormField
        :label="labSlipSlot?.label ?? 'Scanned Lab Slip'"
        required
        :description="labSlipSlot?.accept ? `Accepted: ${labSlipSlot.accept}` : undefined"
      >
        <UFileUpload
          v-model="slotFiles[LAB_SLIP_SLOT_ID]"
          position="inside"
          layout="list"
          :accept="labSlipSlot?.accept"
          icon="i-ri-upload-cloud-2-line"
          :label="`Drop ${(labSlipSlot?.label ?? 'lab slip').toLowerCase()} here`"
          description="Click or drag to upload"
          class="min-h-32"
          @update:model-value="(file: File | null | undefined) => file && emit('fileSelected', LAB_SLIP_SLOT_ID, file)"
        />
      </UFormField>
      <p v-if="!pendingLabSlip && uploadedLabSlip" class="text-xs text-muted">
        Previously uploaded: {{ uploadedLabSlip.fileName }}
      </p>
    </div>

    <div v-else-if="caseType" class="space-y-4">
      <div v-for="field in caseType.fields" :key="field.id">
        <UFormField :label="field.label" :required="field.required">
          <UInput
            v-if="field.type === 'text'"
            v-model="labSlipData[field.id]"
            :placeholder="`Enter ${field.label.toLowerCase()}`"
            class="w-full"
          />
          <USelectMenu
            v-else-if="field.type === 'select'"
            v-model="labSlipData[field.id]"
            :items="field.options || []"
            :placeholder="`Select ${field.label.toLowerCase()}`"
            class="w-full"
          />
          <UTextarea
            v-else-if="field.type === 'textarea'"
            v-model="labSlipData[field.id]"
            :placeholder="`Enter ${field.label.toLowerCase()}`"
            class="w-full"
            :rows="3"
          />
        </UFormField>
      </div>
    </div>

    <UAlert
      v-if="showFormFields && requiredFieldsMissing.length > 0"
      color="warning"
      variant="soft"
      icon="i-ri-error-warning-line"
      :title="`Missing required fields: ${requiredFieldsMissing.join(', ')}`"
    />

    <UAlert
      v-if="isSlipUploadCaseType && slipMode === 'UPLOAD' && !hasLabSlipFile"
      color="warning"
      variant="soft"
      icon="i-ri-error-warning-line"
      title="Please upload a scanned lab slip to continue."
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
