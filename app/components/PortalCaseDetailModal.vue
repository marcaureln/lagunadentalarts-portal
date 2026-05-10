<script setup lang="ts">
import { permissions } from '~~/shared/utils/permissions';

interface CaseFile {
  slotId: string;
  fileName: string;
  fileSize?: number;
  uploadedAt?: string;
  path?: string;
}

type CaseStatus = 'DRAFT' | 'SUBMITTED' | 'NEEDS_INFO' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface CaseDetail {
  id: string;
  patientName: string;
  patientExternalId?: string;
  status: CaseStatus;
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
  assignedTo: { id: string; name: string } | null;
  events: Array<{
    id: string;
    type: string;
    fromStatus?: string;
    toStatus?: string;
    message?: string | null;
    createdAt: string;
    createdBy: { id: string; name: string };
  }>;
}

interface LabUser {
  id: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

const props = defineProps<{
  caseId: string;
}>();

const emit = defineEmits<{
  close: [];
  edit: [caseId: string];
  changed: [];
}>();

const { user } = useUserSession();

const isOpen = ref(false);
const isLoading = ref(false);
const caseDetail = ref<CaseDetail | null>(null);
const error = ref('');
type ActionKey = 'assign' | 'start-working' | 'mark-complete' | 'request-info' | 'cancel-case';

const busyAction = ref<ActionKey | null>(null);
const isBusy = (key: ActionKey) => busyAction.value === key;
const isAnyBusy = computed(() => busyAction.value !== null);
const actionError = ref('');

const requestInfoOpen = ref(false);
const requestInfoMessage = ref('');

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
  ASSIGNED: 'Case assigned',
  UNASSIGNED: 'Case unassigned',
};

const role = computed(() => user.value?.role);
const userId = computed(() => user.value?.id);
const isLabUser = computed(() => permissions.isLDAUser(role.value));
const isManager = computed(() => role.value === 'ADMIN');
const isArtist = computed(() => role.value === 'USER');

const status = computed(() => caseDetail.value?.status);
const assignedId = computed(() => caseDetail.value?.assignedTo?.id ?? null);
const ownsCase = computed(() => isManager.value || (assignedId.value != null && assignedId.value === userId.value));

const isTerminal = computed(
  () => status.value === 'COMPLETED' || status.value === 'CANCELLED' || status.value === 'DRAFT'
);

const canSelfAssignNow = computed(() => isArtist.value && status.value === 'SUBMITTED' && assignedId.value == null);
const canManagerAssign = computed(
  () => isManager.value && status.value && ['SUBMITTED', 'ACCEPTED', 'IN_PROGRESS'].includes(status.value)
);
const canStartWorking = computed(() => status.value === 'ACCEPTED' && ownsCase.value);
const canMarkComplete = computed(() => status.value === 'IN_PROGRESS' && ownsCase.value);
const canRequestInfo = computed(
  () => isLabUser.value && status.value && ['SUBMITTED', 'ACCEPTED', 'IN_PROGRESS'].includes(status.value)
);
const canCancel = computed(
  () => isLabUser.value && status.value && ['SUBMITTED', 'NEEDS_INFO', 'ACCEPTED', 'IN_PROGRESS'].includes(status.value)
);

const labUsers = ref<LabUser[]>([]);
const labUsersLoaded = ref(false);

const ensureLabUsers = async () => {
  if (labUsersLoaded.value) return;
  try {
    const res = await $fetch<LabUser[]>('/api/lab-users');
    labUsers.value = res;
    labUsersLoaded.value = true;
  } catch (e) {
    console.error('Failed to load lab users:', e);
  }
};

const assignDropdownItems = computed(() => {
  const items: Array<Array<{ label: string; icon?: string; onSelect: () => void }>> = [];

  const userItems = labUsers.value.map((u) => ({
    label: u.name + (u.id === assignedId.value ? ' (current)' : ''),
    icon: u.id === assignedId.value ? 'i-ri-check-line' : undefined,
    onSelect: () => assignTo(u.id),
  }));

  if (userItems.length > 0) items.push(userItems);

  if (assignedId.value) {
    items.push([
      {
        label: 'Unassign',
        icon: 'i-ri-user-unfollow-line',
        onSelect: () => assignTo(null),
      },
    ]);
  }

  return items;
});

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
  if (isManager.value) {
    ensureLabUsers();
  }
};

const close = () => {
  isOpen.value = false;
  caseDetail.value = null;
  actionError.value = '';
  requestInfoOpen.value = false;
  requestInfoMessage.value = '';
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

const performAction = async (key: ActionKey, fn: () => Promise<unknown>) => {
  if (busyAction.value) return;
  busyAction.value = key;
  actionError.value = '';
  try {
    await fn();
    await loadCaseDetail();
    emit('changed');
  } catch (e: unknown) {
    const err = e as { statusMessage?: string; data?: { statusMessage?: string }; message?: string };
    actionError.value = err.statusMessage || err.data?.statusMessage || err.message || 'Action failed';
  } finally {
    busyAction.value = null;
  }
};

const assignTo = (assigneeId: string | null) =>
  performAction('assign', () => $fetch(`/api/cases/${props.caseId}/assign`, { method: 'POST', body: { assigneeId } }));

const assignToMe = () => {
  if (!userId.value) return;
  return assignTo(userId.value);
};

const transitionTo = (key: ActionKey, to: CaseStatus, message?: string) =>
  performAction(key, () => $fetch(`/api/cases/${props.caseId}/transition`, { method: 'POST', body: { to, message } }));

const startWorking = () => transitionTo('start-working', 'IN_PROGRESS');
const markComplete = () => transitionTo('mark-complete', 'COMPLETED');

const openRequestInfo = () => {
  requestInfoMessage.value = '';
  requestInfoOpen.value = true;
};

const submitRequestInfo = async () => {
  const msg = requestInfoMessage.value.trim();
  if (!msg) return;
  await transitionTo('request-info', 'NEEDS_INFO', msg);
  requestInfoOpen.value = false;
  requestInfoMessage.value = '';
};

const cancelCase = async () => {
  if (!confirm('Cancel this case? This cannot be undone.')) return;
  await transitionTo('cancel-case', 'CANCELLED');
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
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
        <UIcon name="i-ri-loader-4-line" class="mb-4 h-8 w-8 animate-spin text-primary" />
        <p class="text-muted">Loading case details...</p>
      </div>

      <div v-else-if="error" class="py-8 text-center">
        <UIcon name="i-ri-error-warning-line" class="mb-4 h-12 w-12 text-error" />
        <p class="text-error">{{ error }}</p>
        <UButton class="mt-4" variant="outline" @click="loadCaseDetail">Retry</UButton>
      </div>

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

        <!-- Assignment strip (lab users only, non-DRAFT) -->
        <div
          v-if="isLabUser && caseDetail.status !== 'DRAFT'"
          class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-default bg-elevated/50 px-4 py-3"
        >
          <div class="flex items-center gap-2 text-sm">
            <UIcon name="i-ri-user-line" class="h-4 w-4 text-muted" />
            <span class="text-muted">Assigned to:</span>
            <span v-if="caseDetail.assignedTo" class="font-medium">{{ caseDetail.assignedTo.name }}</span>
            <span v-else class="text-muted italic">Unassigned</span>
          </div>

          <div v-if="!isTerminal" class="flex items-center gap-2">
            <UButton
              v-if="canSelfAssignNow"
              size="sm"
              color="primary"
              icon="i-ri-user-add-line"
              :loading="isBusy('assign')"
              :disabled="isAnyBusy && !isBusy('assign')"
              @click="assignToMe"
            >
              Assign to me
            </UButton>

            <UDropdownMenu v-if="canManagerAssign" :items="assignDropdownItems">
              <UButton
                size="sm"
                color="neutral"
                variant="outline"
                icon="i-ri-user-shared-line"
                :loading="isBusy('assign')"
                :disabled="isAnyBusy && !isBusy('assign')"
              >
                {{ caseDetail.assignedTo ? 'Reassign' : 'Assign…' }}
              </UButton>
            </UDropdownMenu>
          </div>
        </div>

        <!-- Action error -->
        <UAlert v-if="actionError" color="error" icon="i-ri-error-warning-line" :description="actionError" />

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

        <UCollapsible class="overflow-hidden rounded-lg border border-default">
          <template #default="{ open: expanded }">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 bg-elevated/50 px-4 py-3 text-left"
            >
              <h3 class="font-semibold">Activity</h3>
              <UIcon :name="expanded ? 'i-ri-arrow-up-s-line' : 'i-ri-arrow-down-s-line'" class="h-5 w-5 text-muted" />
            </button>
          </template>
          <template #content>
            <div class="space-y-4 px-4 py-4">
              <div v-for="event in caseDetail.events" :key="event.id" class="flex gap-3">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
                >
                  <UIcon
                    :name="
                      event.type === 'CREATED'
                        ? 'i-ri-add-line'
                        : event.type === 'SUBMITTED'
                          ? 'i-ri-send-plane-line'
                          : event.type === 'STATUS_CHANGED'
                            ? 'i-ri-refresh-line'
                            : event.type === 'ASSIGNED' || event.type === 'UNASSIGNED'
                              ? 'i-ri-user-line'
                              : 'i-ri-edit-line'
                    "
                    class="h-4 w-4 text-muted"
                  />
                </div>
                <div class="flex-1">
                  <p class="space-x-1 text-sm">
                    <span class="font-medium">{{ event.createdBy.name }}</span>
                    <span class="text-muted"> {{ eventTypeLabels[event.type] || event.type }}</span>
                    <span
                      v-if="event.type === 'STATUS_CHANGED' && event.fromStatus && event.toStatus"
                      class="text-muted"
                    >
                      · {{ statusConfig[event.fromStatus as CaseStatus].label }} →
                      {{ statusConfig[event.toStatus as CaseStatus].label }}
                    </span>
                    <span v-else-if="event.type === 'ASSIGNED' && event.message" class="text-muted">
                      · {{ event.message }}
                    </span>
                  </p>
                  <p v-if="event.message && event.type !== 'ASSIGNED'" class="mt-1 text-sm text-muted">
                    {{ event.message }}
                  </p>
                  <p class="mt-1 text-xs text-muted">{{ formatDate(event.createdAt) }}</p>
                </div>
              </div>
            </div>
          </template>
        </UCollapsible>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <!-- Lab destructive / info actions -->
          <UButton
            v-if="canRequestInfo"
            size="sm"
            color="warning"
            variant="outline"
            icon="i-ri-question-line"
            :disabled="isAnyBusy"
            @click="openRequestInfo"
          >
            Request info
          </UButton>
          <UButton
            v-if="canCancel"
            size="sm"
            color="error"
            variant="ghost"
            icon="i-ri-close-circle-line"
            :loading="isBusy('cancel-case')"
            :disabled="isAnyBusy && !isBusy('cancel-case')"
            @click="cancelCase"
          >
            Cancel case
          </UButton>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UButton color="neutral" variant="outline" @click="close">Close</UButton>

          <!-- Practice actions -->
          <UButton v-if="caseDetail?.status === 'DRAFT'" color="primary" icon="i-ri-edit-line" @click="onEdit">
            Continue editing
          </UButton>
          <UButton
            v-else-if="
              caseDetail?.status === 'NEEDS_INFO' &&
              permissions.canEditCase(role, user?.practiceId, caseDetail.practice.id, caseDetail.status)
            "
            color="warning"
            icon="i-ri-edit-line"
            @click="onEdit"
          >
            Address &amp; Resubmit
          </UButton>

          <!-- Lab workflow actions -->
          <UButton
            v-if="canStartWorking"
            color="primary"
            icon="i-ri-play-line"
            :loading="isBusy('start-working')"
            :disabled="isAnyBusy && !isBusy('start-working')"
            @click="startWorking"
          >
            Start working
          </UButton>
          <UButton
            v-if="canMarkComplete"
            color="success"
            icon="i-ri-checkbox-circle-line"
            :loading="isBusy('mark-complete')"
            :disabled="isAnyBusy && !isBusy('mark-complete')"
            @click="markComplete"
          >
            Mark complete
          </UButton>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Request info sub-modal -->
  <UModal v-model:open="requestInfoOpen" title="Request more information" :ui="{ content: 'sm:max-w-lg' }">
    <template #body>
      <div class="space-y-3">
        <p class="text-sm text-muted">
          Describe what the practice needs to clarify or add. They will see this message and be able to edit the case.
        </p>
        <UTextarea
          v-model="requestInfoMessage"
          :rows="5"
          autofocus
          placeholder="e.g. The bite registration is missing, please upload before we proceed."
          class="w-full"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" :disabled="isAnyBusy" @click="requestInfoOpen = false">
          Cancel
        </UButton>
        <UButton
          color="warning"
          icon="i-ri-send-plane-line"
          :disabled="!requestInfoMessage.trim() || (isAnyBusy && !isBusy('request-info'))"
          :loading="isBusy('request-info')"
          @click="submitRequestInfo"
        >
          Send request
        </UButton>
      </div>
    </template>
  </UModal>
</template>
