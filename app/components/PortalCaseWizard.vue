<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { CaseFile, CaseType } from '~~/shared/types/case';

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
const step1Schema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  patientExternalId: z.string().optional(),
  caseTypeId: z.string().min(1, 'Case type is required'),
});

type Step1Schema = z.output<typeof step1Schema>;

const step1Form = reactive<Step1Schema>({
  patientName: '',
  patientExternalId: '',
  caseTypeId: '',
});

const selectedPatient = ref<{ label: string; value: string } | undefined>(undefined);
const isNewPatient = ref(false);

const patientSearch = usePatientSearch();

const onPatientCreate = (item: string) => {
  isNewPatient.value = true;
  step1Form.patientName = item;
  step1Form.patientExternalId = '';
  selectedPatient.value = { label: item, value: '__new__' };
};

watch(selectedPatient, (patient) => {
  if (!patient) {
    isNewPatient.value = false;
    step1Form.patientName = '';
    step1Form.patientExternalId = '';
    return;
  }
  if (patient.value === '__new__') return;

  isNewPatient.value = false;
  const existing = patientSearch.results.value.find((p) => p.id === patient.value);
  if (existing) {
    step1Form.patientName = existing.name;
    step1Form.patientExternalId = existing.externalId || '';
  }
});

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

// Step 4: Consent
const consentChecked = ref(false);

const selectedCaseType = computed(() => {
  if (!caseTypes.value || !step1Form.caseTypeId) return null;
  return caseTypes.value.find((ct) => ct.id === step1Form.caseTypeId) || null;
});

const caseTypeOptions = computed(() => (caseTypes.value ?? []).map((ct) => ({ value: ct.id, label: ct.label })));

const requiredFieldsMissing = computed(() => {
  if (!selectedCaseType.value) return [];
  return selectedCaseType.value.fields
    .filter((f) => f.required)
    .filter((f) => {
      const val = labSlipData.value[f.id];
      return val === undefined || val === null || val === '';
    })
    .map((f) => f.label);
});

const requiredFilesMissing = computed(() => {
  if (!selectedCaseType.value) return [];
  return selectedCaseType.value.fileSlots
    .filter((s) => s.required)
    .filter((s) => !uploadedFiles.value.some((f) => f.slotId === s.id))
    .map((s) => s.label);
});

const canProceedStep2 = computed(() => requiredFieldsMissing.value.length === 0);
const canProceedStep3 = computed(() => requiredFilesMissing.value.length === 0);
const canSubmit = computed(() => consentChecked.value);

const stepTitles = ['Patient & Case Type', 'Lab Slip', 'Upload Files', 'Review & Submit'];

const resetWizard = () => {
  currentStep.value = 1;
  selectedPatient.value = undefined;
  patientSearch.term.value = '';
  patientSearch.results.value = [];
  isNewPatient.value = false;
  step1Form.patientName = '';
  step1Form.patientExternalId = '';
  step1Form.caseTypeId = '';
  labSlipData.value = {};
  uploadedFiles.value = [];
  slotFiles.value = {};
  pendingFiles.value.clear();
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

    const hasLabSlipData = Object.keys(labSlipData.value).length > 0;
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

watch(isOpen, async (newVal) => {
  if (newVal && props.caseId) {
    await loadExistingCase(props.caseId);
  }
});

const handleStep1Submit = (_event: FormSubmitEvent<Step1Schema>) => {
  currentStep.value = 2;
};
const goToStep3 = () => {
  currentStep.value = 3;
};
const goToStep4 = () => {
  currentStep.value = 4;
};
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
  const result = await submission.saveCase({
    caseId: createdCase.value?.id || props.caseId || null,
    payload: buildPayload(),
    pendingFiles: pendingFiles.value,
    submit,
    successMessage: submit ? 'Case submitted successfully!' : 'Draft saved successfully!',
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
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditMode ? 'Continue Case' : 'Upload New Case'"
    :description="`Step ${currentStep} of ${totalSteps}: ${stepTitles[currentStep - 1]}`"
    scrollable
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <slot />

    <template #body>
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
        <UIcon name="i-ri-loader-4-line" class="mb-4 h-8 w-8 animate-spin text-primary" />
        <p class="text-muted">Loading case details...</p>
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

        <!-- Step 1: Patient & Case Type -->
        <div v-if="currentStep === 1" class="space-y-4">
          <UForm :schema="step1Schema" :state="step1Form" @submit="handleStep1Submit">
            <div class="space-y-4">
              <UFormField label="Patient" name="patientName" required>
                <UInputMenu
                  v-model="selectedPatient"
                  v-model:search-term="patientSearch.term.value"
                  :items="patientSearch.options.value"
                  :loading="false"
                  create-item
                  ignore-filter
                  placeholder="Search or type patient name..."
                  class="w-full"
                  icon="i-ri-user-line"
                  @update:search-term="patientSearch.search"
                  @create="onPatientCreate"
                />
                <p v-if="isNewPatient" class="mt-1 text-xs text-muted">
                  New patient "{{ step1Form.patientName }}" will be created
                </p>
              </UFormField>

              <UFormField
                v-if="isNewPatient"
                label="Patient ID (Optional)"
                name="patientExternalId"
                hint="For new patients"
              >
                <UInput v-model="step1Form.patientExternalId" placeholder="External patient ID" class="w-full" />
              </UFormField>

              <UFormField label="Case Type" name="caseTypeId" required>
                <USelectMenu
                  v-model="step1Form.caseTypeId"
                  :items="caseTypeOptions"
                  value-key="value"
                  label-key="label"
                  placeholder="Select case type"
                  class="w-full"
                />
              </UFormField>

              <div v-if="selectedCaseType?.instructions" class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <div class="flex gap-2">
                  <UIcon name="i-ri-information-line" class="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  <p class="text-sm text-blue-700 dark:text-blue-300">{{ selectedCaseType.instructions }}</p>
                </div>
              </div>

              <UAlert v-if="error" color="error" variant="soft" :title="error" />

              <div class="mt-6 flex justify-between">
                <UButton type="button" color="neutral" variant="ghost" @click="closeWizard(false)">Cancel</UButton>
                <div class="flex gap-2">
                  <UButton
                    type="button"
                    color="neutral"
                    variant="outline"
                    :loading="isSavingDraft"
                    :disabled="isSubmittingCase || !step1Form.patientName || !step1Form.caseTypeId"
                    @click="saveDraft"
                  >
                    Save Draft
                  </UButton>
                  <UButton type="submit">Next</UButton>
                </div>
              </div>
            </div>
          </UForm>
        </div>

        <!-- Step 2: Lab Slip -->
        <div v-else-if="currentStep === 2" class="space-y-4">
          <p class="text-sm text-muted">Fill in the clinical details for this case.</p>

          <div v-if="selectedCaseType" class="space-y-4">
            <div v-for="field in selectedCaseType.fields" :key="field.id">
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
            v-if="requiredFieldsMissing.length > 0"
            color="warning"
            variant="soft"
            icon="i-ri-error-warning-line"
            :title="`Missing required fields: ${requiredFieldsMissing.join(', ')}`"
          />

          <UAlert v-if="error" color="error" variant="soft" :title="error" />

          <div class="mt-6 flex justify-between">
            <UButton type="button" color="neutral" variant="ghost" @click="goBack">Back</UButton>
            <div class="flex gap-2">
              <UButton
                color="neutral"
                variant="outline"
                :loading="isSavingDraft"
                :disabled="isSubmittingCase || !step1Form.patientName || !step1Form.caseTypeId"
                @click="saveDraft"
              >
                Save Draft
              </UButton>
              <UButton :disabled="!canProceedStep2" @click="goToStep3">Next</UButton>
            </div>
          </div>
        </div>

        <!-- Step 3: Upload Files -->
        <div v-else-if="currentStep === 3" class="space-y-4">
          <p class="text-sm text-muted">Upload the required files for this case.</p>

          <div v-if="selectedCaseType" class="space-y-4">
            <div v-for="slot in selectedCaseType.fileSlots" :key="slot.id">
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
                  @update:model-value="(file: File | null | undefined) => file && handleFileUpload(slot.id, file)"
                />
              </UFormField>
            </div>
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
            <UButton type="button" color="neutral" variant="ghost" @click="goBack">Back</UButton>
            <div class="flex gap-2">
              <UButton
                color="neutral"
                variant="outline"
                :loading="isSavingDraft"
                :disabled="isSubmittingCase || !step1Form.patientName || !step1Form.caseTypeId"
                @click="saveDraft"
              >
                Save Draft
              </UButton>
              <UButton :disabled="!canProceedStep3" @click="goToStep4">Next</UButton>
            </div>
          </div>
        </div>

        <!-- Step 4: Review & Submit -->
        <div v-else-if="currentStep === 4" class="space-y-4">
          <PortalCaseWizardStep4Review
            v-model:consent-checked="consentChecked"
            :patient-name="step1Form.patientName"
            :patient-external-id="step1Form.patientExternalId || ''"
            :case-type="selectedCaseType"
            :lab-slip-data="labSlipData"
            :uploaded-files="uploadedFiles"
          />

          <UAlert v-if="error" color="error" variant="soft" :title="error" />

          <div class="mt-6 flex justify-between">
            <UButton type="button" color="neutral" variant="ghost" @click="goBack">Back</UButton>
            <div class="flex gap-2">
              <UButton
                color="neutral"
                variant="outline"
                :loading="isSavingDraft"
                :disabled="isSubmittingCase || !step1Form.patientName || !step1Form.caseTypeId"
                @click="saveDraft"
              >
                Save Draft
              </UButton>
              <UButton
                color="primary"
                :loading="isSubmittingCase"
                :disabled="isSavingDraft || !canSubmit"
                @click="submitCase"
              >
                Submit Case
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </template>
  </UModal>
</template>
