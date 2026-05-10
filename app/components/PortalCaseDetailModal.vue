<script setup lang="ts">
interface CaseFile {
  slotId: string;
  fileName: string;
  fileSize?: number;
  uploadedAt?: string;
  path?: string;
}

interface CaseDetail {
  id: string;
  patientName: string;
  patientExternalId?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_INFO' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  data: Record<string, string>;
  files: CaseFile[];
  createdAt: string;
  updatedAt: string;
  practice: { id: string; name: string };
  caseType: {
    id: string;
    key: string;
    label: string;
    fields: Array<{ id: string; label: string; type: string; required?: boolean }>;
    fileSlots: Array<{ id: string; label: string; required?: boolean; accept?: string }>;
  };
  createdBy: { id: string; name: string };
  events: Array<{
    id: string;
    type: string;
    fromStatus?: string;
    toStatus?: string;
    notes?: string;
    createdAt: string;
    createdBy: { id: string; name: string };
  }>;
}

const props = defineProps<{
  caseId: string;
}>();

const emit = defineEmits<{
  close: [];
  edit: [caseId: string];
}>();

const isOpen = ref(false);
const isLoading = ref(false);
const caseDetail = ref<CaseDetail | null>(null);
const error = ref('');

const statusConfig = {
  DRAFT: { color: 'neutral', label: 'Draft' },
  SUBMITTED: { color: 'primary', label: 'Submitted' },
  NEEDS_INFO: { color: 'error', label: 'Needs Info' },
  ACCEPTED: { color: 'info', label: 'Accepted' },
  IN_PROGRESS: { color: 'warning', label: 'In Progress' },
  COMPLETED: { color: 'success', label: 'Completed' },
  CANCELLED: { color: 'neutral', label: 'Cancelled' },
} as const;

const eventTypeLabels: Record<string, string> = {
  CREATED: 'Case created',
  SUBMITTED: 'Case submitted',
  STATUS_CHANGED: 'Status changed',
  UPDATED: 'Case updated',
  FILE_UPLOADED: 'File uploaded',
  COMMENT_ADDED: 'Comment added',
};

const loadCaseDetail = async () => {
  isLoading.value = true;
  error.value = '';

  try {
    const res = await $fetch<CaseDetail>(`/api/cases/${props.caseId}`);
    caseDetail.value = res;
  } catch (e) {
    console.error('Failed to load case:', e);
    error.value = 'Failed to load case details';
  } finally {
    isLoading.value = false;
  }
};

const open = () => {
  isOpen.value = true;
  loadCaseDetail();
};

const close = () => {
  isOpen.value = false;
  caseDetail.value = null;
  emit('close');
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileUrl = (file: CaseFile) => {
  const path = file.path ?? `${file.slotId}/${file.fileName}`;
  return `/api/cases/${props.caseId}/files/${path}`;
};

const onEdit = () => {
  if (!caseDetail.value) return;
  const id = caseDetail.value.id;
  isOpen.value = false;
  emit('edit', id);
};

defineExpose({ open });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="caseDetail ? `Case: ${caseDetail.patientName}` : 'Case Details'"
    :description="caseDetail ? caseDetail.caseType.label : ''"
    scrollable
    :ui="{ content: 'sm:max-w-3xl' }"
    @update:open="(val) => !val && close()"
  >
    <slot />

    <template #body>
      <!-- Loading state -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
        <UIcon name="i-ri-loader-4-line" class="mb-4 h-8 w-8 animate-spin text-primary" />
        <p class="text-muted">Loading case details...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="py-8 text-center">
        <UIcon name="i-ri-error-warning-line" class="mb-4 h-12 w-12 text-error" />
        <p class="text-error">{{ error }}</p>
        <UButton class="mt-4" variant="outline" @click="loadCaseDetail">Retry</UButton>
      </div>

      <!-- Case details -->
      <div v-else-if="caseDetail" class="space-y-6">
        <!-- Status & Meta -->
        <div class="flex flex-wrap items-center gap-4">
          <UBadge
            :color="statusConfig[caseDetail.status].color"
            :variant="caseDetail.status === 'NEEDS_INFO' ? 'solid' : 'subtle'"
            size="lg"
          >
            {{ statusConfig[caseDetail.status].label }}
          </UBadge>
          <span class="text-sm text-muted">Created {{ formatDate(caseDetail.createdAt) }}</span>
          <span class="text-sm text-muted">by {{ caseDetail.createdBy.name }}</span>
        </div>

        <!-- Needs Info Alert -->
        <UAlert
          v-if="caseDetail.status === 'NEEDS_INFO'"
          color="error"
          icon="i-ri-error-warning-line"
          title="Additional Information Required"
          description="The lab has requested additional information for this case. Please review the comments below."
        />

        <!-- Patient Info -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Patient Information</h3>
          </template>
          <dl class="grid gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-muted">Patient Name</dt>
              <dd class="font-medium">{{ caseDetail.patientName }}</dd>
            </div>
            <div v-if="caseDetail.patientExternalId">
              <dt class="text-sm text-muted">Patient ID</dt>
              <dd class="font-medium">{{ caseDetail.patientExternalId }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Practice</dt>
              <dd class="font-medium">{{ caseDetail.practice.name }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Case Type</dt>
              <dd class="font-medium">{{ caseDetail.caseType.label }}</dd>
            </div>
          </dl>
        </UCard>

        <!-- Lab Slip Data -->
        <UCard v-if="Object.keys(caseDetail.data).length > 0">
          <template #header>
            <h3 class="font-semibold">Lab Slip Details</h3>
          </template>
          <dl class="grid gap-4 sm:grid-cols-2">
            <div v-for="field in caseDetail.caseType.fields" :key="field.id">
              <dt class="text-sm text-muted">{{ field.label }}</dt>
              <dd class="font-medium">{{ caseDetail.data[field.id] || '-' }}</dd>
            </div>
          </dl>
        </UCard>

        <!-- Files -->
        <UCard v-if="caseDetail.files.length > 0">
          <template #header>
            <h3 class="font-semibold">Uploaded Files</h3>
          </template>
          <ul class="divide-y divide-gray-200 dark:divide-gray-700">
            <li v-for="file in caseDetail.files" :key="file.slotId" class="flex items-center justify-between py-3">
              <div class="flex items-center gap-3">
                <UIcon name="i-ri-file-line" class="h-5 w-5 text-muted" />
                <div>
                  <p class="font-medium">{{ file.fileName }}</p>
                  <p class="text-xs text-muted">
                    {{ caseDetail.caseType.fileSlots.find((s) => s.id === file.slotId)?.label || file.slotId }}
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

        <!-- Activity Timeline -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Activity</h3>
          </template>
          <div class="space-y-4">
            <div v-for="event in caseDetail.events" :key="event.id" class="flex gap-3">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <UIcon
                  :name="
                    event.type === 'CREATED'
                      ? 'i-ri-add-line'
                      : event.type === 'SUBMITTED'
                        ? 'i-ri-send-plane-line'
                        : event.type === 'STATUS_CHANGED'
                          ? 'i-ri-refresh-line'
                          : 'i-ri-edit-line'
                  "
                  class="h-4 w-4 text-muted"
                />
              </div>
              <div class="flex-1">
                <p class="space-x-1 text-sm">
                  <span class="font-medium">{{ event.createdBy.name }}</span>
                  <span class="text-muted"> {{ eventTypeLabels[event.type] || event.type }}</span>
                </p>
                <p v-if="event.notes" class="mt-1 text-sm text-muted">{{ event.notes }}</p>
                <p class="mt-1 text-xs text-muted">{{ formatDate(event.createdAt) }}</p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" @click="close">Close</UButton>
        <UButton v-if="caseDetail?.status === 'DRAFT'" color="primary" icon="i-ri-edit-line" @click="onEdit">
          Continue editing
        </UButton>
        <UButton v-else-if="caseDetail?.status === 'NEEDS_INFO'" color="warning" icon="i-ri-edit-line" @click="onEdit">
          Address &amp; Resubmit
        </UButton>
      </div>
    </template>
  </UModal>
</template>
