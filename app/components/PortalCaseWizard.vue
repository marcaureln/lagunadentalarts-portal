<script setup lang="ts">
import type { CaseFile, CaseType } from '~~/shared/types/case';
import { SLIP_MODE_KEY } from '~~/shared/utils/caseTypes';

interface CreatedCase {
  id: string;
  patientId?: string;
  patientName: string;
  patientExternalId?: string;
  status: string;
  data: Record<string, unknown>;
  files: CaseFile[];
  caseType: CaseType;
  practice: { id: string; name: string };
  createdBy: { id: string; name: string };
}

const props = defineProps<{
  caseId?: string;
}>();

const emit = defineEmits<{
  success: [];
}>();

const toast = useToast();

const isOpen = ref(false);
const open = () => {
  isOpen.value = true;
};
defineExpose({ open });

const { data: caseTypes } = await useFetch<CaseType[]>('/api/case-types');

const isLoading = ref(false);
const isEditMode = computed(() => !!props.caseId);
const currentStep = ref(1);
const totalSteps = 4;
const error = ref('');

const submission = useCaseSubmission();
const isSavingDraft = submission.isSavingDraft;
const isSubmittingCase = submission.isSubmittingCase;

const createdCase = ref<CreatedCase | null>(null);

// Step 1: Patient & Case Type
const step1Form = reactive({
  patientName: '',
  patientExternalId: '',
  caseTypeId: '',
});
const selectedPatient = ref<{ label: string; value: string } | undefined>(undefined);
const isNewPatient = ref(false);
const selectedPatientId = computed(() => {
  if (!selectedPatient.value || selectedPatient.value.value === '__new__') return null;
  return selectedPatient.value.value;
});

// Step 2: Lab Slip Data
const labSlipData = ref<Record<string, string>>({});

// Step 3: File uploads
const uploadedFiles = ref<CaseFile[]>([]);
const slotFiles = ref<Record<string, File | undefined>>({});
const pendingFiles = ref<Map<string, File>>(new Map());
const uploadSlotProgress = ref<Record<string, number>>({});
const uploadTotalBytes = ref(0);
const uploadCurrentFileName = ref<string | null>(null);
const uploadOverallProgress = computed(() => {
  if (uploadTotalBytes.value === 0) return 0;
  let bytesUploaded = 0;
  for (const [slotId, file] of pendingFiles.value) {
    bytesUploaded += (uploadSlotProgress.value[slotId] ?? 0) * file.size;
  }
  return bytesUploaded / uploadTotalBytes.value;
});
const isUploading = computed(() => uploadTotalBytes.value > 0 && uploadOverallProgress.value < 1);

// Step 4: Consent
const consentChecked = ref(false);

const selectedCaseType = computed(() => {
  if (!caseTypes.value || !step1Form.caseTypeId) return null;
  return caseTypes.value.find((ct) => ct.id === step1Form.caseTypeId) || null;
});
const caseTypeOptions = computed(() => (caseTypes.value ?? []).map((ct) => ({ value: ct.id, label: ct.label })));
const step1Valid = computed(() => !!step1Form.patientName && !!step1Form.caseTypeId);

const stepTitles = ['Patient & Case Type', 'Lab Slip', 'Upload Files', 'Review & Submit'];

const resetWizard = () => {
  currentStep.value = 1;
  selectedPatient.value = undefined;
  isNewPatient.value = false;
  step1Form.patientName = '';
  step1Form.patientExternalId = '';
  step1Form.caseTypeId = '';
  labSlipData.value = {};
  uploadedFiles.value = [];
  slotFiles.value = {};
  pendingFiles.value.clear();
  uploadSlotProgress.value = {};
  uploadTotalBytes.value = 0;
  uploadCurrentFileName.value = null;
  consentChecked.value = false;
  createdCase.value = null;
  error.value = '';
};

const closeWizard = (emitSuccess = false) => {
  isOpen.value = false;
  resetWizard();
  if (emitSuccess) emit('success');
};

const loadExistingCase = async (caseId: string) => {
  isLoading.value = true;
  error.value = '';
  try {
    const res = await $fetch<CreatedCase>(`/api/cases/${caseId}`);
    createdCase.value = res;

    if (res.patientId) {
      selectedPatient.value = {
        label: res.patientName + (res.patientExternalId ? ` (${res.patientExternalId})` : ''),
        value: res.patientId,
      };
      isNewPatient.value = false;
    } else {
      selectedPatient.value = { label: res.patientName, value: '__new__' };
      isNewPatient.value = true;
    }
    step1Form.patientName = res.patientName;
    step1Form.patientExternalId = res.patientExternalId || '';
    step1Form.caseTypeId = res.caseType.id;
    labSlipData.value = (res.data as Record<string, string>) || {};
    uploadedFiles.value = res.files || [];

    const meaningfulKeys = Object.keys(labSlipData.value).filter((k) => k !== SLIP_MODE_KEY);
    const hasLabSlipData = meaningfulKeys.length > 0;
    const hasFiles = uploadedFiles.value.length > 0;
    if (hasFiles) currentStep.value = 4;
    else if (hasLabSlipData) currentStep.value = 3;
    else currentStep.value = 2;
  } catch (e: unknown) {
    error.value =
      e && typeof e === 'object' && 'statusMessage' in e
        ? String((e as { statusMessage?: unknown }).statusMessage || 'Failed to load case')
        : 'Failed to load case';
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isLoading.value = false;
  }
};

watch(
  isOpen,
  async (newVal) => {
    if (newVal && props.caseId) {
      await loadExistingCase(props.caseId);
    }
  },
  { immediate: true }
);

const goBack = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const handleFileUpload = (slotId: string, file: File) => {
  pendingFiles.value.set(slotId, file);
  const existingIndex = uploadedFiles.value.findIndex((f) => f.slotId === slotId);
  const fileData: CaseFile = {
    slotId,
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
  };
  if (existingIndex >= 0) uploadedFiles.value[existingIndex] = fileData;
  else uploadedFiles.value.push(fileData);
};

const buildPayload = () => ({
  patientId: selectedPatientId.value,
  patientName: step1Form.patientName,
  patientExternalId: step1Form.patientExternalId || null,
  caseTypeId: step1Form.caseTypeId,
  data: labSlipData.value,
});

const persist = async (submit: boolean) => {
  error.value = '';
  uploadSlotProgress.value = {};
  uploadCurrentFileName.value = null;
  uploadTotalBytes.value = 0;
  for (const file of pendingFiles.value.values()) {
    uploadTotalBytes.value += file.size;
  }
  const result = await submission.saveCase({
    caseId: createdCase.value?.id || props.caseId || null,
    payload: buildPayload(),
    pendingFiles: pendingFiles.value,
    submit,
    successMessage: submit ? 'Case submitted successfully!' : 'Draft saved successfully!',
    onUploadProgress: ({ slotId, fileName, progress }) => {
      uploadCurrentFileName.value = fileName;
      uploadSlotProgress.value = { ...uploadSlotProgress.value, [slotId]: progress };
    },
  });
  if (result !== null) {
    createdCase.value = result;
    closeWizard(true);
  } else {
    error.value = submission.error.value ?? (submit ? 'Failed to submit case' : 'Failed to save draft');
  }
};

const saveDraft = () => persist(false);
const submitCase = () => persist(true);

const cancelAndClose = async () => {
  if (isUploading.value) {
    await submission.cancelUpload();
  }
  closeWizard(false);
};
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditMode ? 'Continue Case' : 'Upload New Case'"
    :description="`Step ${currentStep} of ${totalSteps}: ${stepTitles[currentStep - 1]}`"
    scrollable
    :dismissible="false"
    :close="false"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <slot />

    <template #body>
      <div v-if="isLoading" class="space-y-6">
        <div class="flex gap-2">
          <div v-for="step in totalSteps" :key="step" class="h-1 flex-1 animate-pulse rounded-full bg-elevated" />
        </div>
        <div v-for="i in 4" :key="i" class="space-y-2">
          <div class="h-4 w-32 animate-pulse rounded bg-elevated" />
          <div class="h-10 w-full animate-pulse rounded bg-elevated" />
        </div>
      </div>

      <template v-else>
        <div class="mb-6 flex gap-2">
          <div
            v-for="step in totalSteps"
            :key="step"
            class="h-1 flex-1 rounded-full transition-colors"
            :class="step <= currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'"
          />
        </div>

        <PortalCaseWizardPatient
          v-if="currentStep === 1"
          v-model:patient-name="step1Form.patientName"
          v-model:patient-external-id="step1Form.patientExternalId"
          v-model:case-type-id="step1Form.caseTypeId"
          v-model:selected-patient="selectedPatient"
          v-model:is-new-patient="isNewPatient"
          :case-type-options="caseTypeOptions"
          :selected-case-type="selectedCaseType"
          :error="error"
          :is-saving-draft="isSavingDraft"
          :is-submitting-case="isSubmittingCase"
          @cancel="cancelAndClose"
          @save-draft="saveDraft"
          @next="currentStep = 2"
        />

        <PortalCaseWizardLabSlip
          v-else-if="currentStep === 2"
          v-model:lab-slip-data="labSlipData"
          v-model:slot-files="slotFiles"
          :case-type="selectedCaseType"
          :error="error"
          :is-saving-draft="isSavingDraft"
          :is-submitting-case="isSubmittingCase"
          :step1-valid="step1Valid"
          :uploaded-files="uploadedFiles"
          @cancel="cancelAndClose"
          @back="goBack"
          @save-draft="saveDraft"
          @next="currentStep = 3"
          @file-selected="handleFileUpload"
        />

        <PortalCaseWizardFiles
          v-else-if="currentStep === 3"
          v-model:slot-files="slotFiles"
          :case-type="selectedCaseType"
          :uploaded-files="uploadedFiles"
          :error="error"
          :is-saving-draft="isSavingDraft"
          :is-submitting-case="isSubmittingCase"
          :step1-valid="step1Valid"
          :is-uploading="isUploading"
          :upload-current-file-name="uploadCurrentFileName"
          :upload-overall-progress="uploadOverallProgress"
          @cancel="cancelAndClose"
          @back="goBack"
          @save-draft="saveDraft"
          @next="currentStep = 4"
          @file-selected="handleFileUpload"
        />

        <PortalCaseWizardReview
          v-else-if="currentStep === 4"
          v-model:consent-checked="consentChecked"
          :patient-name="step1Form.patientName"
          :patient-external-id="step1Form.patientExternalId || ''"
          :case-type="selectedCaseType"
          :lab-slip-data="labSlipData"
          :uploaded-files="uploadedFiles"
          :error="error"
          :is-saving-draft="isSavingDraft"
          :is-submitting-case="isSubmittingCase"
          :step1-valid="step1Valid"
          :is-uploading="isUploading"
          :upload-current-file-name="uploadCurrentFileName"
          :upload-overall-progress="uploadOverallProgress"
          @cancel="cancelAndClose"
          @back="goBack"
          @save-draft="saveDraft"
          @submit="submitCase"
        />
      </template>
    </template>
  </UModal>
</template>
