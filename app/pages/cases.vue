<script setup lang="ts">
import { h } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import { permissions } from '~~/shared/utils/permissions';

const { user } = useUserSession();
const route = useRoute();
const router = useRouter();

useSeoMeta({ title: 'Cases' });

const UBadge = resolveComponent('UBadge');
const UButton = resolveComponent('UButton');
const UDropdownMenu = resolveComponent('UDropdownMenu');

const isPracticeUser = computed(() => permissions.isPracticeUser(user.value?.role));
const isLabUser = computed(() => permissions.isLDAUser(user.value?.role));
const isArtist = computed(() => user.value?.role === 'USER');

interface ApiCase {
  id: string;
  patientName: string;
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_INFO' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  practice: { id: string; name: string };
  caseType: { id: string; key: string; label: string };
  createdBy: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
}

interface LabUser {
  id: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

interface CaseTypeOption {
  id: string;
  label: string;
}

interface PracticeOption {
  id: string;
  name: string;
}

type StatusFilter = 'all' | 'SUBMITTED' | 'NEEDS_INFO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DRAFT';

const ASSIGNEE_ALL = '__all__';
const ASSIGNEE_ME = 'me';
const ASSIGNEE_UNASSIGNED = 'unassigned';
const TYPE_ALL = '__all__';
const PRACTICE_ALL = '__all__';

const statusFilter = ref<StatusFilter>((route.query.status as StatusFilter) || 'all');
const assigneeFilter = ref<string>((route.query.assignee as string) || ASSIGNEE_ALL);
const caseTypeFilter = ref<string>((route.query.caseType as string) || TYPE_ALL);
const practiceFilter = ref<string>((route.query.practice as string) || PRACTICE_ALL);

const submittedLabel = computed(() => (isLabUser.value ? 'Inbox' : 'Submitted'));
const submittedIcon = computed(() => (isLabUser.value ? 'i-ri-inbox-line' : 'i-ri-send-plane-line'));

const statusTabs = computed(() => {
  const tabs: Array<{ value: StatusFilter; label: string; icon: string }> = [
    { value: 'all', label: 'All Cases', icon: 'i-ri-list-check' },
  ];
  if (isPracticeUser.value) {
    tabs.push({ value: 'DRAFT', label: 'Drafts', icon: 'i-ri-draft-line' });
  }
  tabs.push(
    { value: 'SUBMITTED', label: submittedLabel.value, icon: submittedIcon.value },
    { value: 'NEEDS_INFO', label: 'Needs Info', icon: 'i-ri-error-warning-line' },
    { value: 'IN_PROGRESS', label: 'In Progress', icon: 'i-ri-loader-4-line' },
    { value: 'COMPLETED', label: 'Completed', icon: 'i-ri-checkbox-circle-line' },
    { value: 'CANCELLED', label: 'Cancelled', icon: 'i-ri-close-circle-line' }
  );
  return tabs;
});

// Fetch lookups for filter dropdowns
const { data: labUsersData } = useFetch<LabUser[]>('/api/lab-users', {
  lazy: true,
  default: () => [],
  immediate: isLabUser.value,
});
const { data: caseTypesData } = useFetch<CaseTypeOption[]>('/api/case-types', {
  lazy: true,
  default: () => [],
});
const { data: practicesData } = useFetch<PracticeOption[]>('/api/practices', {
  lazy: true,
  default: () => [],
  immediate: isLabUser.value,
});

const assigneeOptions = computed(() => {
  const opts: Array<{ label: string; value: string }> = [{ label: 'Anyone', value: ASSIGNEE_ALL }];
  if (isArtist.value) opts.push({ label: 'Assigned to me', value: ASSIGNEE_ME });
  opts.push({ label: 'Unassigned', value: ASSIGNEE_UNASSIGNED });
  for (const u of labUsersData.value ?? []) {
    opts.push({ label: u.name, value: u.id });
  }
  return opts;
});

const caseTypeOptions = computed(() => [
  { label: 'All types', value: TYPE_ALL },
  ...(caseTypesData.value ?? []).map((t) => ({ label: t.label, value: t.id })),
]);

const practiceOptions = computed(() => [
  { label: 'All practices', value: PRACTICE_ALL },
  ...(practicesData.value ?? []).map((p) => ({ label: p.name, value: p.id })),
]);

const hasActiveFilter = computed(
  () =>
    assigneeFilter.value !== ASSIGNEE_ALL || caseTypeFilter.value !== TYPE_ALL || practiceFilter.value !== PRACTICE_ALL
);

const clearFilters = () => {
  assigneeFilter.value = ASSIGNEE_ALL;
  caseTypeFilter.value = TYPE_ALL;
  practiceFilter.value = PRACTICE_ALL;
};

watch([statusFilter, assigneeFilter, caseTypeFilter, practiceFilter], ([s, a, t, p]) => {
  const query: Record<string, string> = {};
  if (s !== 'all') query.status = s;
  if (a !== ASSIGNEE_ALL) query.assignee = a;
  if (t !== TYPE_ALL) query.caseType = t;
  if (p !== PRACTICE_ALL) query.practice = p;
  router.replace({ query });
});

const casesQuery = computed(() => ({
  status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
  assignedToId: isLabUser.value && assigneeFilter.value !== ASSIGNEE_ALL ? assigneeFilter.value : undefined,
  caseTypeId: caseTypeFilter.value !== TYPE_ALL ? caseTypeFilter.value : undefined,
  practiceId: isLabUser.value && practiceFilter.value !== PRACTICE_ALL ? practiceFilter.value : undefined,
}));

const {
  data: casesData,
  refresh: refreshCases,
  status: casesStatus,
} = useFetch<ApiCase[]>('/api/cases', {
  query: casesQuery,
  lazy: true,
  default: () => [],
});

const cases = computed(() => casesData.value || []);
const isLoadingCases = computed(() => casesStatus.value === 'pending');

const { data: allCasesData, refresh: refreshAllCases } = useFetch<ApiCase[]>('/api/cases', {
  lazy: true,
  default: () => [],
});

const matchesActiveFilters = (c: ApiCase): boolean => {
  if (isLabUser.value && assigneeFilter.value !== ASSIGNEE_ALL) {
    if (assigneeFilter.value === ASSIGNEE_ME) {
      if (c.assignedTo?.id !== user.value?.id) return false;
    } else if (assigneeFilter.value === ASSIGNEE_UNASSIGNED) {
      if (c.assignedTo != null) return false;
    } else if (c.assignedTo?.id !== assigneeFilter.value) {
      return false;
    }
  }
  if (caseTypeFilter.value !== TYPE_ALL && c.caseType.id !== caseTypeFilter.value) return false;
  if (isLabUser.value && practiceFilter.value !== PRACTICE_ALL && c.practice.id !== practiceFilter.value) return false;
  return true;
};

const statusCounts = computed(() => {
  const visible = (allCasesData.value || []).filter(matchesActiveFilters);
  return {
    all: visible.length,
    DRAFT: visible.filter((c) => c.status === 'DRAFT').length,
    SUBMITTED: visible.filter((c) => c.status === 'SUBMITTED').length,
    NEEDS_INFO: visible.filter((c) => c.status === 'NEEDS_INFO').length,
    IN_PROGRESS: visible.filter((c) => ['ACCEPTED', 'IN_PROGRESS'].includes(c.status)).length,
    COMPLETED: visible.filter((c) => c.status === 'COMPLETED').length,
    CANCELLED: visible.filter((c) => c.status === 'CANCELLED').length,
  };
});

const allStatusConfig = {
  DRAFT: { color: 'neutral', label: 'Draft' },
  SUBMITTED: { color: 'primary', label: 'Submitted' },
  NEEDS_INFO: { color: 'error', label: 'Needs Info' },
  ACCEPTED: { color: 'info', label: 'Accepted' },
  IN_PROGRESS: { color: 'warning', label: 'In Progress' },
  COMPLETED: { color: 'success', label: 'Completed' },
  CANCELLED: { color: 'neutral', label: 'Cancelled' },
} as const;

const columns = computed<TableColumn<ApiCase>[]>(() => {
  const cols: TableColumn<ApiCase>[] = [
    {
      accessorKey: 'patientName',
      header: 'Patient',
      cell: ({ row }) => h('span', { class: 'font-medium' }, row.getValue('patientName')),
    },
    {
      accessorKey: 'caseType',
      header: 'Type',
      cell: ({ row }) => {
        const caseType = row.original.caseType;
        return h('span', { class: 'text-gray-600 dark:text-gray-400' }, caseType?.label || '-');
      },
    },
  ];

  if (!isPracticeUser.value) {
    cols.unshift({
      accessorKey: 'practice',
      header: 'Practice',
      cell: ({ row }) => {
        const practice = row.original.practice;
        return h('span', { class: 'text-gray-600 dark:text-gray-400' }, practice?.name || '-');
      },
    });
  }

  cols.push(
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as ApiCase['status'];
        const config = allStatusConfig[status];
        const variant = status === 'NEEDS_INFO' ? 'solid' : 'subtle';
        return h(UBadge, { color: config.color, variant, label: config.label });
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return h('span', { class: 'text-sm' }, new Date(date).toLocaleDateString());
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ row }) => {
        const date = row.getValue('updatedAt') as string;
        return h('span', { class: 'text-sm text-muted' }, new Date(date).toLocaleDateString());
      },
    },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      cell: ({ row }) => {
        const createdBy = row.original.createdBy;
        return h('span', { class: 'text-gray-600 dark:text-gray-400' }, createdBy?.name || '-');
      },
    }
  );

  if (isLabUser.value) {
    cols.push({
      accessorKey: 'assignedTo',
      header: 'Assigned To',
      cell: ({ row }) => {
        const assignee = row.original.assignedTo;
        if (!assignee) {
          return h('span', { class: 'text-sm text-muted italic' }, 'Unassigned');
        }
        return h('span', { class: 'text-sm text-gray-700 dark:text-gray-300' }, assignee.name);
      },
    });
  }

  if (isPracticeUser.value) {
    cols.push({
      id: 'actions',
      enableHiding: false,
      meta: { class: { td: 'w-fit' } },
      cell: ({ row }) => {
        const caseData = row.original;
        const items = [];

        if (caseData.status === 'DRAFT') {
          items.push([
            {
              label: 'Continue editing',
              icon: 'i-ri-edit-line',
              onSelect: () => openEditWizard(caseData.id),
            },
            {
              label: 'Delete draft',
              icon: 'i-ri-delete-bin-line',
              color: 'error' as const,
              onSelect: () => deleteDraftCase(caseData.id),
            },
          ]);
        } else {
          items.push([
            {
              label: 'View details',
              icon: 'i-ri-eye-line',
              onSelect: () => openCaseDetail(caseData.id),
            },
          ]);
        }

        if (items.length === 0) return null;

        return h(
          'div',
          { class: 'text-right' },
          h(
            UDropdownMenu,
            { items, content: { align: 'end' } },
            {
              default: () =>
                h(UButton, {
                  icon: 'i-ri-more-2-fill',
                  color: 'neutral',
                  variant: 'ghost',
                  class: 'ml-auto',
                }),
            }
          )
        );
      },
    });
  }

  return cols;
});

const editingCaseId = ref<string | null>(null);
const editWizardRef = ref<{ open: () => void } | null>(null);

const openEditWizard = (caseId: string) => {
  editingCaseId.value = caseId;
  nextTick(() => {
    editWizardRef.value?.open();
  });
};

const refreshAll = () => {
  refreshCases();
  refreshAllCases();
};

const onEditWizardSuccess = () => {
  editingCaseId.value = null;
  refreshAll();
};

const viewingCaseId = ref<string | null>(null);
const caseDetailRef = ref<{ open: () => void } | null>(null);

const openCaseDetail = (caseId: string) => {
  viewingCaseId.value = caseId;
  nextTick(() => {
    caseDetailRef.value?.open();
  });
};

const onEditFromDetail = (caseId: string) => {
  viewingCaseId.value = null;
  openEditWizard(caseId);
};

const deleteDraftCase = async (caseId: string) => {
  if (!confirm('Are you sure you want to delete this draft?')) return;

  try {
    await $fetch(`/api/cases/${caseId}`, { method: 'DELETE' });
    refreshAll();
  } catch (e) {
    console.error('Failed to delete draft:', e);
  }
};

const onRowSelect = (_e: Event, row: TableRow<ApiCase>) => {
  const caseData = row.original;
  if (caseData.status === 'DRAFT' && isPracticeUser.value) {
    openEditWizard(caseData.id);
  } else {
    openCaseDetail(caseData.id);
  }
};

const canCreateCase = computed(() => permissions.canCreateCase(user.value?.role));
const showFilterRow = computed(() => isLabUser.value || (caseTypesData.value?.length ?? 0) > 1);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Cases">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <PortalCaseWizard v-if="canCreateCase" @success="refreshAll">
            <UButton icon="i-ri-upload-2-line" color="primary"> Upload New Case </UButton>
          </PortalCaseWizard>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="tab in statusTabs"
            :key="tab.value"
            :icon="tab.icon"
            :color="statusFilter === tab.value ? 'primary' : 'neutral'"
            :variant="statusFilter === tab.value ? 'solid' : 'ghost'"
            size="sm"
            @click="statusFilter = tab.value"
          >
            {{ tab.label }}
            <UBadge
              v-if="statusCounts[tab.value] > 0"
              :color="tab.value === 'NEEDS_INFO' ? 'error' : 'neutral'"
              :variant="statusFilter === tab.value ? 'solid' : 'subtle'"
              size="sm"
              class="ml-1.5"
            >
              {{ statusCounts[tab.value] }}
            </UBadge>
          </UButton>
        </div>

        <div v-if="showFilterRow" class="flex flex-wrap items-center gap-3">
          <USelectMenu
            v-if="isLabUser"
            v-model="assigneeFilter"
            :items="assigneeOptions"
            value-key="value"
            label-key="label"
            placeholder="Assignee"
            icon="i-ri-user-line"
            class="w-52"
            size="sm"
          />
          <USelectMenu
            v-model="caseTypeFilter"
            :items="caseTypeOptions"
            value-key="value"
            label-key="label"
            placeholder="Case type"
            icon="i-ri-stethoscope-line"
            class="w-52"
            size="sm"
          />
          <USelectMenu
            v-if="isLabUser"
            v-model="practiceFilter"
            :items="practiceOptions"
            value-key="value"
            label-key="label"
            placeholder="Practice"
            icon="i-ri-building-line"
            class="w-52"
            size="sm"
          />
          <UButton
            v-if="hasActiveFilter"
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-ri-close-line"
            @click="clearFilters"
          >
            Clear
          </UButton>
        </div>

        <UCard :ui="{ body: 'p-0!' }">
          <div v-if="isLoadingCases && cases.length === 0" class="flex items-center justify-center py-16">
            <UIcon name="i-ri-loader-4-line" class="h-6 w-6 animate-spin text-primary" />
          </div>
          <UTable v-else :data="cases" :columns="columns" @select="onRowSelect">
            <template #empty>
              <div class="flex flex-col items-center justify-center py-16">
                <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <UIcon
                    :name="
                      statusFilter === 'all'
                        ? 'i-ri-folder-line'
                        : statusTabs.find((t) => t.value === statusFilter)?.icon || 'i-ri-folder-line'
                    "
                    class="h-8 w-8 text-gray-400"
                  />
                </div>
                <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {{
                    statusFilter === 'all'
                      ? 'No cases yet'
                      : `No ${statusTabs.find((t) => t.value === statusFilter)?.label.toLowerCase()}`
                  }}
                </h3>
                <p class="mb-6 max-w-sm text-center text-gray-500">
                  <template v-if="statusFilter === 'all'">
                    {{
                      canCreateCase
                        ? 'Upload your first case to get started.'
                        : 'Cases will appear here once submitted.'
                    }}
                  </template>
                  <template v-else> There are no cases with this status. Try selecting a different filter. </template>
                </p>
                <div class="flex gap-3">
                  <UButton
                    v-if="statusFilter !== 'all'"
                    variant="outline"
                    color="neutral"
                    @click.stop="statusFilter = 'all'"
                  >
                    View All Cases
                  </UButton>
                  <PortalCaseWizard v-if="canCreateCase" @success="refreshAll">
                    <UButton icon="i-ri-upload-2-line" color="primary">Upload New Case</UButton>
                  </PortalCaseWizard>
                </div>
              </div>
            </template>
          </UTable>
        </UCard>
      </div>

      <PortalCaseWizard
        v-if="editingCaseId"
        ref="editWizardRef"
        :case-id="editingCaseId"
        @success="onEditWizardSuccess"
      />

      <PortalCaseDetailModal
        v-if="viewingCaseId"
        ref="caseDetailRef"
        :case-id="viewingCaseId"
        @close="viewingCaseId = null"
        @edit="onEditFromDetail"
        @changed="refreshAll"
      />
    </template>
  </UDashboardPanel>
</template>
