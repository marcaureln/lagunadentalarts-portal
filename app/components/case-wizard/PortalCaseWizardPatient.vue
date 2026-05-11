<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { CaseType } from '~~/shared/types/case';

defineProps<{
  caseTypeOptions: { value: string; label: string }[];
  selectedCaseType: CaseType | null;
  error: string;
  isSavingDraft: boolean;
  isSubmittingCase: boolean;
}>();

const patientName = defineModel<string>('patientName', { required: true });
const patientExternalId = defineModel<string>('patientExternalId', { required: true });
const caseTypeId = defineModel<string>('caseTypeId', { required: true });
const selectedPatient = defineModel<{ label: string; value: string } | undefined>('selectedPatient', {
  required: true,
});
const isNewPatient = defineModel<boolean>('isNewPatient', { required: true });

const emit = defineEmits<{
  cancel: [];
  saveDraft: [];
  next: [];
}>();

const step1Schema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  patientExternalId: z.string().optional(),
  caseTypeId: z.string().min(1, 'Case type is required'),
});

type Step1Schema = z.output<typeof step1Schema>;

const step1Form = reactive({
  get patientName() {
    return patientName.value;
  },
  set patientName(v: string) {
    patientName.value = v;
  },
  get patientExternalId() {
    return patientExternalId.value;
  },
  set patientExternalId(v: string) {
    patientExternalId.value = v;
  },
  get caseTypeId() {
    return caseTypeId.value;
  },
  set caseTypeId(v: string) {
    caseTypeId.value = v;
  },
});

const patientSearch = usePatientSearch();

const onPatientCreate = (item: string) => {
  isNewPatient.value = true;
  patientName.value = item;
  patientExternalId.value = '';
  selectedPatient.value = { label: item, value: '__new__' };
};

watch(selectedPatient, (patient) => {
  if (!patient) {
    isNewPatient.value = false;
    patientName.value = '';
    patientExternalId.value = '';
    return;
  }
  if (patient.value === '__new__') return;

  isNewPatient.value = false;
  const existing = patientSearch.results.value.find((p) => p.id === patient.value);
  if (existing) {
    patientName.value = existing.name;
    patientExternalId.value = existing.externalId || '';
  }
});

const handleSubmit = (_event: FormSubmitEvent<Step1Schema>) => {
  emit('next');
};
</script>

<template>
  <div class="space-y-4">
    <UForm :schema="step1Schema" :state="step1Form" @submit="handleSubmit">
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
          <p v-if="isNewPatient" class="mt-1 text-xs text-muted">New patient "{{ patientName }}" will be created</p>
        </UFormField>

        <UFormField v-if="isNewPatient" label="Patient ID (Optional)" name="patientExternalId" hint="For new patients">
          <UInput v-model="patientExternalId" placeholder="External patient ID" class="w-full" />
        </UFormField>

        <UFormField label="Case Type" name="caseTypeId" required>
          <USelectMenu
            v-model="caseTypeId"
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
          <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">Cancel</UButton>
          <div class="flex gap-2">
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              :loading="isSavingDraft"
              :disabled="isSubmittingCase || !patientName || !caseTypeId"
              @click="emit('saveDraft')"
            >
              Save Draft
            </UButton>
            <UButton type="submit">Next</UButton>
          </div>
        </div>
      </div>
    </UForm>
  </div>
</template>
