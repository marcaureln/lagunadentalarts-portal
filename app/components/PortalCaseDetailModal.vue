<script setup lang="ts">
import { permissions, type CaseStatusName } from '~~/shared/utils/permissions';
import { CASE_STATUS_META } from '~~/shared/utils/caseStatus';
import { formatDateTime as formatDate } from '~~/shared/utils/format';
import type { CaseFile, CaseTypeField, CaseTypeFileSlot } from '~~/shared/types/case';
import type { ActionKey } from './case-detail/PortalCaseDetailActions.vue';

interface CaseDetail {
  id: string;
  patientName: string;
  patientExternalId?: string;
  status: CaseStatusName;
  data: Record<string, string>;
  files: CaseFile[];
  createdAt: string;
  updatedAt: string;
  practice: { id: string; name: string };
  caseType: {
    id: string;
    key: string;
    label: string;
    fields: CaseTypeField[];
    fileSlots: CaseTypeFileSlot[];
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

const caseForPermissions = computed(() => {
  const c = caseDetail.value;
  return c ? { status: c.status, assignedToId: c.assignedTo?.id ?? null, practiceId: c.practice.id } : null;
});
const perms = useCasePermissions(caseForPermissions);
const { labUsers, ensure: ensureLabUsers } = useLabUsersCache();

type FullActionKey = 'assign' | ActionKey;

const busyAction = ref<FullActionKey | null>(null);
const isAnyBusy = computed(() => busyAction.value !== null);
const actionError = ref('');

const requestInfoOpen = ref(false);
const isRequestInfoBusy = computed(() => busyAction.value === 'request-info');

const assignMutation = useApiMutation('Failed to update assignment');
const transitionMutation = useApiMutation('Failed to update case');

const canResubmitNeedsInfo = computed(() => {
  const c = caseDetail.value;
  if (!c) return false;
  return (
    c.status === 'NEEDS_INFO' &&
    permissions.canEditCase({
      role: perms.role.value,
      userPracticeId: user.value?.practiceId,
      casePracticeId: c.practice.id,
      caseStatus: c.status,
    })
  );
});

const loadCaseDetail = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    caseDetail.value = await $fetch<CaseDetail>(`/api/cases/${props.caseId}`);
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
  if (perms.isManager.value) ensureLabUsers();
};

const close = () => {
  isOpen.value = false;
  caseDetail.value = null;
  actionError.value = '';
  requestInfoOpen.value = false;
  emit('close');
};

const onEdit = () => {
  if (!caseDetail.value) return;
  const id = caseDetail.value.id;
  isOpen.value = false;
  emit('edit', id);
};

const runAction = async (key: FullActionKey, fn: () => Promise<unknown>) => {
  if (busyAction.value) return;
  busyAction.value = key;
  actionError.value = '';
  const result = await fn();
  if (result !== null) {
    await loadCaseDetail();
    emit('changed');
  } else {
    actionError.value =
      (key === 'assign' ? assignMutation.error.value : transitionMutation.error.value) ?? 'Action failed';
  }
  busyAction.value = null;
};

const ACTION_TO_STATUS: Record<ActionKey, CaseStatusName> = {
  'start-working': 'IN_PROGRESS',
  'mark-complete': 'COMPLETED',
  'request-info': 'NEEDS_INFO',
  'cancel-case': 'CANCELLED',
};

const onAction = async (key: ActionKey) => {
  if (key === 'cancel-case' && !confirm('Cancel this case? This cannot be undone.')) return;
  await runAction(key, () =>
    transitionMutation.mutate(
      `/api/cases/${props.caseId}/transition`,
      { method: 'POST', body: { to: ACTION_TO_STATUS[key] } },
      { silent: true }
    )
  );
};

const onAssignToMe = async () => {
  const me = user.value?.id;
  if (!me) return;
  await onAssign(me);
};

const onAssign = async (assigneeId: string | null) => {
  await runAction('assign', () =>
    assignMutation.mutate(
      `/api/cases/${props.caseId}/assign`,
      { method: 'POST', body: { assigneeId } },
      { silent: true }
    )
  );
};

const onRequestInfoSubmit = async (message: string) => {
  if (busyAction.value) return;
  busyAction.value = 'request-info';
  actionError.value = '';
  const result = await transitionMutation.mutate(
    `/api/cases/${props.caseId}/transition`,
    { method: 'POST', body: { to: 'NEEDS_INFO', message } },
    { silent: true }
  );
  busyAction.value = null;
  if (result !== null) {
    requestInfoOpen.value = false;
    await loadCaseDetail();
    emit('changed');
  } else {
    actionError.value = transitionMutation.error.value ?? 'Action failed';
  }
};

defineExpose({ open });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="caseDetail ? `Case: ${caseDetail.patientName}` : 'Case Details'"
    :description="caseDetail ? caseDetail.caseType.label : ''"
    :ui="{ content: 'sm:max-w-3xl' }"
    @update:open="(val) => !val && close()"
  >
    <slot />

    <template #body>
      <div v-if="isLoading" class="space-y-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="h-6 w-24 animate-pulse rounded bg-elevated" />
          <div class="h-4 w-40 animate-pulse rounded bg-elevated" />
          <div class="h-4 w-28 animate-pulse rounded bg-elevated" />
        </div>
        <div v-for="i in 3" :key="i" class="space-y-3 rounded-lg border border-default p-4">
          <div class="h-5 w-32 animate-pulse rounded bg-elevated" />
          <div class="h-4 w-full animate-pulse rounded bg-elevated" />
          <div class="h-4 w-3/4 animate-pulse rounded bg-elevated" />
        </div>
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
            :color="CASE_STATUS_META[caseDetail.status].color"
            :variant="caseDetail.status === 'NEEDS_INFO' ? 'solid' : 'subtle'"
            size="lg"
          >
            {{ CASE_STATUS_META[caseDetail.status].label }}
          </UBadge>
          <span class="text-sm text-muted">Created {{ formatDate(caseDetail.createdAt) }}</span>
          <span class="text-sm text-muted">by {{ caseDetail.createdBy.name }}</span>
        </div>

        <PortalCaseDetailAssignment
          v-if="perms.isLabUser.value && caseDetail.status !== 'DRAFT'"
          :assigned-to="caseDetail.assignedTo"
          :lab-users="labUsers"
          :can-self-assign-now="perms.canSelfAssignNow.value"
          :can-manager-assign="perms.canManagerAssign.value"
          :is-lab-inactionable="perms.isLabInactionable.value"
          :busy="busyAction === 'assign'"
          :any-busy="isAnyBusy"
          @assign-to-me="onAssignToMe"
          @assign="onAssign"
        />

        <UAlert v-if="actionError" color="error" icon="i-ri-error-warning-line" :description="actionError" />

        <UAlert
          v-if="caseDetail.status === 'NEEDS_INFO'"
          color="error"
          icon="i-ri-error-warning-line"
          title="Additional Information Required"
          description="The lab has requested additional information for this case. Please review the comments below."
        />

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

        <PortalCaseDetailFiles
          v-if="caseDetail.files.length > 0"
          :case-id="caseDetail.id"
          :files="caseDetail.files"
          :file-slots="caseDetail.caseType.fileSlots"
          :events="caseDetail.events"
        />

        <PortalCaseDetailActivity :events="caseDetail.events" />
      </div>
    </template>

    <template #footer>
      <PortalCaseDetailActions
        :status="perms.status.value"
        :can-request-info="perms.canRequestInfo.value"
        :can-cancel="perms.canCancel.value"
        :can-start-working="perms.canStartWorking.value"
        :can-mark-complete="perms.canMarkComplete.value"
        :can-resubmit-needs-info="canResubmitNeedsInfo"
        :is-any-busy="isAnyBusy"
        :busy-action="busyAction === 'assign' || busyAction === 'request-info' ? null : busyAction"
        @action="onAction"
        @request-info="requestInfoOpen = true"
        @edit="onEdit"
        @close="close"
      />
    </template>
  </UModal>

  <PortalCaseDetailRequestInfo v-model:open="requestInfoOpen" :busy="isRequestInfoBusy" @submit="onRequestInfoSubmit" />
</template>
