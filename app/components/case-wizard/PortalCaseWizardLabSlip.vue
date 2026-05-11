<script setup lang="ts">
import type { CaseType } from '~~/shared/types/case';

const props = defineProps<{
  caseType: CaseType | null;
  error: string;
  isSavingDraft: boolean;
  isSubmittingCase: boolean;
  step1Valid: boolean;
}>();

const labSlipData = defineModel<Record<string, string>>('labSlipData', { required: true });

const emit = defineEmits<{
  cancel: [];
  back: [];
  saveDraft: [];
  next: [];
}>();

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

const canProceed = computed(() => requiredFieldsMissing.value.length === 0);
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">Fill in the clinical details for this case.</p>

    <div v-if="caseType" class="space-y-4">
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
      v-if="requiredFieldsMissing.length > 0"
      color="warning"
      variant="soft"
      icon="i-ri-error-warning-line"
      :title="`Missing required fields: ${requiredFieldsMissing.join(', ')}`"
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
