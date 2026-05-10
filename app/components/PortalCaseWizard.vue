<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

interface CaseTypeField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
}

interface CaseTypeFileSlot {
  id: string;
  label: string;
  required: boolean;
  accept?: string;
}

interface CaseType {
  id: string;
  key: string;
  label: string;
  fields: CaseTypeField[];
  fileSlots: CaseTypeFileSlot[];
  instructions: string | null;
}

interface CaseFile {
  slotId: string;
  fileName: string;
  fileSize?: number;
  uploadedAt?: string;
}

interface Patient {
  id: string;
  name: string;
  externalId: string | null;
}

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

// Expose open method for programmatic usage (must be before await)
const isOpen = ref(false);
const open = () => {
  isOpen.value = true;
};
defineExpose({ open });

// Fetch case types
const { data: caseTypes } = await useFetch<CaseType[]>('/api/case-types');

// Wizard state
const isLoading = ref(false);
const isEditMode = computed(() => !!props.caseId);
const currentStep = ref(1);
const totalSteps = 4;
const isSubmitting = ref(false);
const error = ref('');

// Created case (after step 1)
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

// Patient selection with autocomplete + create
const selectedPatient = ref<{ label: string; value: string } | undefined>(undefined);
const patientSearchTerm = ref('');
const patientResults = ref<Patient[]>([]);
const isNewPatient = ref(false);

const searchPatients = useDebounceFn(async (query: string) => {
  if (!query || query.length < 2) {
    patientResults.value = [];
    return;
  }

  try {
    const results = await $fetch<Patient[]>('/api/patients', {
      query: { search: query },
    });
    patientResults.value = results;
  } catch (e) {
    console.error('Failed to search patients:', e);
    patientResults.value = [];
  }
}, 300);

const patientOptions = computed(() => {
  return patientResults.value.map((p) => ({
    value: p.id,
    label: p.name + (p.externalId ? ` (${p.externalId})` : ''),
  }));
});

// Handle patient creation from InputMenu
const onPatientCreate = (item: string) => {
  isNewPatient.value = true;
  step1Form.patientName = item;
  step1Form.patientExternalId = '';
  selectedPatient.value = { label: item, value: '__new__' };
};

// Watch for patient selection changes
watch(selectedPatient, (patient) => {
  if (!patient) {
    isNewPatient.value = false;
    step1Form.patientName = '';
    step1Form.patientExternalId = '';
    return;
  }

  if (patient.value === '__new__') {
    // New patient - already handled by onPatientCreate
    return;
  }

  // Existing patient selected
  isNewPatient.value = false;
  const existingPatient = patientResults.value.find((p) => p.id === patient.value);
  if (existingPatient) {
    step1Form.patientName = existingPatient.name;
    step1Form.patientExternalId = existingPatient.externalId || '';
  }
});

// Computed to get selectedPatientId for API calls
const selectedPatientId = computed(() => {
  if (!selectedPatient.value || selectedPatient.value.value === '__new__') {
    return null;
  }
  return selectedPatient.value.value;
});

// Step 2: Lab Slip Data (dynamic based on case type)
const labSlipData = ref<Record<string, string>>({});

// Step 3: File uploads
const uploadedFiles = ref<CaseFile[]>([]);
const slotFiles = ref<Record<string, File | undefined>>({});

// Step 4: Consent
const consentChecked = ref(false);

// Computed
const selectedCaseType = computed(() => {
  if (!caseTypes.value || !step1Form.caseTypeId) return null;
  return caseTypes.value.find((ct) => ct.id === step1Form.caseTypeId) || null;
});

const caseTypeOptions = computed(() => {
  if (!caseTypes.value) return [];
  return caseTypes.value.map((ct) => ({
    value: ct.id,
    label: ct.label,
  }));
});

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

// Methods
const resetWizard = () => {
  currentStep.value = 1;
  selectedPatient.value = undefined;
  patientSearchTerm.value = '';
  patientResults.value = [];
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
  if (emitSuccess) {
    emit('success');
  }
};

// Load existing case for editing
const loadExistingCase = async (caseId: string) => {
  isLoading.value = true;
  error.value = '';

  try {
    const res = await $fetch<CreatedCase>(`/api/cases/${caseId}`);
    createdCase.value = res;

    // Populate step 1 form
    if (res.patientId) {
      // Existing patient linked
      selectedPatient.value = {
        label: res.patientName + (res.patientExternalId ? ` (${res.patientExternalId})` : ''),
        value: res.patientId,
      };
      isNewPatient.value = false;
    } else {
      // New patient (not yet linked)
      selectedPatient.value = { label: res.patientName, value: '__new__' };
      isNewPatient.value = true;
    }
    step1Form.patientName = res.patientName;
    step1Form.patientExternalId = res.patientExternalId || '';
    step1Form.caseTypeId = res.caseType.id;

    // Populate step 2 lab slip data
    labSlipData.value = (res.data as Record<string, string>) || {};

    // Populate step 3 files
    uploadedFiles.value = res.files || [];

    // Determine which step to start at based on completion
    const hasLabSlipData = Object.keys(labSlipData.value).length > 0;
    const hasFiles = uploadedFiles.value.length > 0;

    if (hasFiles) {
      currentStep.value = 4; // Go to review
    } else if (hasLabSlipData) {
      currentStep.value = 3; // Go to files
    } else {
      currentStep.value = 2; // Go to lab slip
    }
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'statusMessage' in e) {
      error.value = String((e as { statusMessage?: unknown }).statusMessage || 'Failed to load case');
    } else {
      error.value = 'Failed to load case';
    }
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isLoading.value = false;
  }
};

// Watch for modal open to load existing case
watch(isOpen, async (newVal) => {
  if (newVal && props.caseId) {
    await loadExistingCase(props.caseId);
  }
});

const handleStep1Submit = async (_event: FormSubmitEvent<Step1Schema>) => {
  // Just move to next step - no API call
  currentStep.value = 2;
};

const goToStep3 = () => {
  // Just move to next step - no API call
  currentStep.value = 3;
};

const pendingFiles = ref<Map<string, File>>(new Map());

const handleFileUpload = (slotId: string, file: File) => {
  // Store the file for later upload and track metadata
  pendingFiles.value.set(slotId, file);

  const existingIndex = uploadedFiles.value.findIndex((f) => f.slotId === slotId);
  const fileData: CaseFile = {
    slotId,
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    uploadedFiles.value[existingIndex] = fileData;
  } else {
    uploadedFiles.value.push(fileData);
  }
};

const _removeFile = (slotId: string) => {
  uploadedFiles.value = uploadedFiles.value.filter((f) => f.slotId !== slotId);
  pendingFiles.value.delete(slotId);
  slotFiles.value[slotId] = undefined;
};

const goToStep4 = () => {
  // Just move to next step - no API call
  currentStep.value = 4;
};

// Save as draft - creates or updates the case
const saveDraft = async () => {
  isSubmitting.value = true;
  error.value = '';

  try {
    let caseId = createdCase.value?.id || props.caseId;

    if (caseId) {
      // Update existing case
      const res = await $fetch<CreatedCase>(`/api/cases/${caseId}`, {
        method: 'PATCH',
        body: {
          patientId: selectedPatientId.value,
          patientName: step1Form.patientName,
          patientExternalId: step1Form.patientExternalId || null,
          data: labSlipData.value,
        },
      });
      createdCase.value = res;
    } else {
      // Create new case as draft
      const res = await $fetch<CreatedCase>('/api/cases', {
        method: 'POST',
        body: {
          patientId: selectedPatientId.value,
          patientName: step1Form.patientName,
          patientExternalId: step1Form.patientExternalId || null,
          caseTypeId: step1Form.caseTypeId,
          data: labSlipData.value,
        },
      });
      createdCase.value = res;
      caseId = res.id;
    }

    // Upload any pending files
    for (const [slotId, file] of pendingFiles.value.entries()) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slotId', slotId);

      await $fetch(`/api/cases/${caseId}/files`, {
        method: 'POST',
        body: formData,
      });
    }
    pendingFiles.value.clear();

    toast.add({ description: 'Draft saved successfully!', color: 'success' });
    closeWizard(true);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'statusMessage' in e) {
      error.value = String((e as { statusMessage?: unknown }).statusMessage || 'Failed to save draft');
    } else {
      error.value = 'Failed to save draft';
    }
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};

const submitCase = async () => {
  isSubmitting.value = true;
  error.value = '';

  try {
    let caseId = createdCase.value?.id || props.caseId;

    if (caseId) {
      // Update existing case first
      await $fetch<CreatedCase>(`/api/cases/${caseId}`, {
        method: 'PATCH',
        body: {
          patientId: selectedPatientId.value,
          patientName: step1Form.patientName,
          patientExternalId: step1Form.patientExternalId || null,
          data: labSlipData.value,
        },
      });
    } else {
      // Create new case
      const res = await $fetch<CreatedCase>('/api/cases', {
        method: 'POST',
        body: {
          patientId: selectedPatientId.value,
          patientName: step1Form.patientName,
          patientExternalId: step1Form.patientExternalId || null,
          caseTypeId: step1Form.caseTypeId,
          data: labSlipData.value,
        },
      });
      createdCase.value = res;
      caseId = res.id;
    }

    // Upload any pending files
    for (const [slotId, file] of pendingFiles.value.entries()) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slotId', slotId);

      await $fetch(`/api/cases/${caseId}/files`, {
        method: 'POST',
        body: formData,
      });
    }
    pendingFiles.value.clear();

    // Submit the case
    await $fetch(`/api/cases/${caseId}/submit`, {
      method: 'POST',
    });

    toast.add({ description: 'Case submitted successfully!', color: 'success' });
    closeWizard(true);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'statusMessage' in e) {
      error.value = String((e as { statusMessage?: unknown }).statusMessage || 'Failed to submit case');
    } else {
      error.value = 'Failed to submit case';
    }
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};

const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
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
      <!-- Loading state when fetching existing case -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
        <UIcon name="i-ri-loader-4-line" class="mb-4 h-8 w-8 animate-spin text-primary" />
        <p class="text-muted">Loading case details...</p>
      </div>

      <template v-else>
        <!-- Progress bar -->
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
                  v-model:search-term="patientSearchTerm"
                  :items="patientOptions"
                  :loading="false"
                  create-item
                  ignore-filter
                  placeholder="Search or type patient name..."
                  class="w-full"
                  icon="i-ri-user-line"
                  @update:search-term="searchPatients"
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
                    :loading="isSubmitting"
                    :disabled="!step1Form.patientName || !step1Form.caseTypeId"
                    @click="saveDraft"
                    >Save Draft</UButton
                  >
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
                :loading="isSubmitting"
                :disabled="!step1Form.patientName || !step1Form.caseTypeId"
                @click="saveDraft"
                >Save Draft</UButton
              >
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
                :loading="isSubmitting"
                :disabled="!step1Form.patientName || !step1Form.caseTypeId"
                @click="saveDraft"
                >Save Draft</UButton
              >
              <UButton :disabled="!canProceedStep3" @click="goToStep4">Next</UButton>
            </div>
          </div>
        </div>

        <!-- Step 4: Review & Submit -->
        <div v-else-if="currentStep === 4" class="space-y-4">
          <p class="text-sm text-muted">Review your case details before submitting.</p>

          <div class="space-y-4">
            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <h4 class="mb-2 font-medium">Patient Information</h4>
              <dl class="grid grid-cols-2 gap-2 text-sm">
                <dt class="text-muted">Name:</dt>
                <dd>{{ step1Form.patientName }}</dd>
                <dt class="text-muted">External ID:</dt>
                <dd>{{ step1Form.patientExternalId || '-' }}</dd>
              </dl>
            </div>

            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <h4 class="mb-2 font-medium">Case Type</h4>
              <p>{{ selectedCaseType?.label }}</p>
            </div>

            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <h4 class="mb-2 font-medium">Lab Slip Details</h4>
              <dl class="grid grid-cols-2 gap-2 text-sm">
                <template v-for="field in selectedCaseType?.fields" :key="field.id">
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

          <UAlert v-if="error" color="error" variant="soft" :title="error" />

          <div class="mt-6 flex justify-between">
            <UButton type="button" color="neutral" variant="ghost" @click="goBack">Back</UButton>
            <div class="flex gap-2">
              <UButton
                color="neutral"
                variant="outline"
                :loading="isSubmitting"
                :disabled="!step1Form.patientName || !step1Form.caseTypeId"
                @click="saveDraft"
                >Save Draft</UButton
              >
              <UButton color="primary" :loading="isSubmitting" :disabled="!canSubmit" @click="submitCase">
                Submit Case
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </template>
  </UModal>
</template>
