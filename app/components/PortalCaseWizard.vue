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

interface CreatedCase {
  id: string;
  patientName: string;
  patientExternalId?: string;
  status: string;
  data: Record<string, unknown>;
  files: CaseFile[];
  caseType: CaseType;
  practice: { id: string; name: string };
  createdBy: { id: string; name: string };
}

const emit = defineEmits<{
  success: [];
}>();

const toast = useToast();

// Fetch case types
const { data: caseTypes } = await useFetch<CaseType[]>('/api/case-types');

// Wizard state
const isOpen = ref(false);
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

// Step 2: Lab Slip Data (dynamic based on case type)
const labSlipData = ref<Record<string, string>>({});

// Step 3: File uploads
const uploadedFiles = ref<CaseFile[]>([]);

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
  step1Form.patientName = '';
  step1Form.patientExternalId = '';
  step1Form.caseTypeId = '';
  labSlipData.value = {};
  uploadedFiles.value = [];
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

const handleStep1Submit = async (event: FormSubmitEvent<Step1Schema>) => {
  isSubmitting.value = true;
  error.value = '';

  try {
    const res = await $fetch<CreatedCase>('/api/cases', {
      method: 'POST',
      body: event.data,
    });

    createdCase.value = res;
    currentStep.value = 2;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'statusMessage' in e) {
      error.value = String((e as { statusMessage?: unknown }).statusMessage || 'Failed to create case');
    } else {
      error.value = 'Failed to create case';
    }
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};

const saveLabSlip = async () => {
  if (!createdCase.value) return;

  isSubmitting.value = true;
  error.value = '';

  try {
    const res = await $fetch<CreatedCase>(`/api/cases/${createdCase.value.id}`, {
      method: 'PATCH',
      body: { data: labSlipData.value },
    });

    createdCase.value = res;
    currentStep.value = 3;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'statusMessage' in e) {
      error.value = String((e as { statusMessage?: unknown }).statusMessage || 'Failed to save lab slip');
    } else {
      error.value = 'Failed to save lab slip';
    }
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
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

const removeFile = (slotId: string) => {
  uploadedFiles.value = uploadedFiles.value.filter((f) => f.slotId !== slotId);
  pendingFiles.value.delete(slotId);
};

const saveFiles = async () => {
  if (!createdCase.value) return;

  isSubmitting.value = true;
  error.value = '';

  try {
    // Upload each pending file to the server
    for (const [slotId, file] of pendingFiles.value.entries()) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slotId', slotId);

      await $fetch(`/api/cases/${createdCase.value.id}/files`, {
        method: 'POST',
        body: formData,
      });
    }

    // Clear pending files after successful upload
    pendingFiles.value.clear();

    // Refresh case data
    const res = await $fetch<CreatedCase>(`/api/cases/${createdCase.value.id}`);
    createdCase.value = res;
    currentStep.value = 4;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'statusMessage' in e) {
      error.value = String((e as { statusMessage?: unknown }).statusMessage || 'Failed to upload files');
    } else {
      error.value = 'Failed to upload files';
    }
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};

const submitCase = async () => {
  if (!createdCase.value) return;

  isSubmitting.value = true;
  error.value = '';

  try {
    await $fetch(`/api/cases/${createdCase.value.id}/submit`, {
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
    title="Upload New Case"
    :description="`Step ${currentStep} of ${totalSteps}: ${stepTitles[currentStep - 1]}`"
    scrollable
    :ui="{ content: 'sm:max-w-2xl' }"
    @update:open="(val) => !val && closeWizard(false)"
  >
    <slot />

    <template #body>
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
            <UFormField label="Patient Name" name="patientName" required>
              <UInput v-model="step1Form.patientName" placeholder="Enter patient name" class="w-full" />
            </UFormField>

            <UFormField label="Patient ID (Optional)" name="patientExternalId">
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

            <div class="mt-6 flex justify-end gap-3">
              <UButton type="button" color="neutral" variant="ghost" @click="closeWizard(false)">Cancel</UButton>
              <UButton type="submit" :loading="isSubmitting">Next</UButton>
            </div>
          </div>
        </UForm>
      </div>

      <!-- Step 2: Lab Slip -->
      <div v-else-if="currentStep === 2" class="space-y-4">
        <p class="text-muted text-sm">Fill in the clinical details for this case.</p>

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
          <UButton :loading="isSubmitting" :disabled="!canProceedStep2" @click="saveLabSlip">Next</UButton>
        </div>
      </div>

      <!-- Step 3: Upload Files -->
      <div v-else-if="currentStep === 3" class="space-y-4">
        <p class="text-muted text-sm">Upload the required files for this case.</p>

        <div v-if="selectedCaseType" class="space-y-4">
          <div v-for="slot in selectedCaseType.fileSlots" :key="slot.id" class="rounded-lg border p-4">
            <div class="flex items-start justify-between">
              <div>
                <p class="font-medium">
                  {{ slot.label }}
                  <span v-if="slot.required" class="text-red-500">*</span>
                </p>
                <p v-if="slot.accept" class="text-muted text-xs">Accepted: {{ slot.accept }}</p>
              </div>

              <div v-if="uploadedFiles.find((f) => f.slotId === slot.id)" class="flex items-center gap-2">
                <UIcon name="i-ri-check-line" class="h-5 w-5 text-green-500" />
                <span class="text-sm text-green-600">
                  {{ uploadedFiles.find((f) => f.slotId === slot.id)?.fileName }}
                </span>
                <span class="text-muted text-xs">
                  ({{ formatFileSize(uploadedFiles.find((f) => f.slotId === slot.id)?.fileSize) }})
                </span>
                <UButton
                  icon="i-ri-delete-bin-line"
                  color="error"
                  variant="ghost"
                  size="xs"
                  @click="removeFile(slot.id)"
                />
              </div>
            </div>

            <div v-if="!uploadedFiles.find((f) => f.slotId === slot.id)" class="mt-3">
              <label
                class="hover:border-primary flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors dark:border-gray-600"
              >
                <UIcon name="i-ri-upload-cloud-2-line" class="mb-2 h-8 w-8 text-gray-400" />
                <span class="text-sm text-gray-600 dark:text-gray-400">Click to upload</span>
                <input
                  type="file"
                  class="hidden"
                  :accept="slot.accept"
                  @change="
                    (e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.files?.[0]) handleFileUpload(slot.id, target.files[0]);
                    }
                  "
                />
              </label>
            </div>
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
          <UButton :loading="isSubmitting" :disabled="!canProceedStep3" @click="saveFiles">Next</UButton>
        </div>
      </div>

      <!-- Step 4: Review & Submit -->
      <div v-else-if="currentStep === 4" class="space-y-4">
        <p class="text-muted text-sm">Review your case details before submitting.</p>

        <div class="space-y-4">
          <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h4 class="mb-2 font-medium">Patient Information</h4>
            <dl class="grid grid-cols-2 gap-2 text-sm">
              <dt class="text-muted">Name:</dt>
              <dd>{{ createdCase?.patientName }}</dd>
              <dt class="text-muted">External ID:</dt>
              <dd>{{ createdCase?.patientExternalId || '-' }}</dd>
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
                <span class="text-muted text-xs">({{ formatFileSize(file.fileSize) }})</span>
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
          <UButton color="primary" :loading="isSubmitting" :disabled="!canSubmit" @click="submitCase">
            Submit Case
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
