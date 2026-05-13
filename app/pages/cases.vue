<script setup lang="ts">
import { h } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import { permissions, type CaseStatusName } from '~~/shared/utils/permissions';
import { formatDate } from '~~/shared/utils/format';
import { CASE_STATUS_META } from '~~/shared/utils/caseStatus';
import { useApiMutation } from '~~/app/composables/useApiMutation';

const { user } = useUserSession();
const route = useRoute();
const router = useRouter();

useSeoMeta({ title: 'Cases' });

const UBadge = resolveComponent('UBadge');
const UButton = resolveComponent('UButton');
const UDropdownMenu = resolveComponent('UDropdownMenu');
const UIcon = resolveComponent('UIcon');
const UTooltip = resolveComponent('UTooltip');
const UAvatar = resolveComponent('UAvatar');

const isPracticeUser = computed(() => permissions.isPracticeUser(user.value?.role));
const isLabUser = computed(() => permissions.isLabUser(user.value?.role));

interface ApiCase {
  id: string;
  patientName: string;
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_INFO' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  practice: { id: string; name: string };
  caseType: { id: string; key: string; label: string };
  createdBy: { id: string; name: string };
  assignedTo: { id: string; name: string; avatarUrl?: string | null } | null;
  fileTypes?: string[];
  _count?: { events: number };
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

type StatusFilter = 'SUBMITTED' | 'NEEDS_INFO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DRAFT';

const ASSIGNEE_ALL = '__all__';
const ASSIGNEE_ME = 'me';
const ASSIGNEE_UNASSIGNED = 'unassigned';
const TYPE_ALL = '__all__';
const PRACTICE_ALL = '__all__';

const submittedLabel = computed(() => (isLabUser.value ? 'Inbox' : 'Submitted'));
const submittedIcon = computed(() => (isLabUser.value ? 'i-ri-inbox-line' : 'i-ri-send-plane-line'));

const statusTabs = computed(() => {
  const tabs: Array<{ value: StatusFilter; label: string; icon: string }> = [];
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

const defaultStatus = computed<StatusFilter>(() => (isPracticeUser.value ? 'DRAFT' : 'SUBMITTED'));
const VALID_STATUSES: StatusFilter[] = ['DRAFT', 'SUBMITTED', 'NEEDS_INFO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const queryStatus = route.query.status as string | undefined;
const statusFilter = ref<StatusFilter>(
  queryStatus && VALID_STATUSES.includes(queryStatus as StatusFilter)
    ? (queryStatus as StatusFilter)
    : defaultStatus.value
);
const assigneeFilter = ref<string>((route.query.assignee as string) || ASSIGNEE_ALL);
const caseTypeFilter = ref<string>((route.query.caseType as string) || TYPE_ALL);
const practiceFilter = ref<string>((route.query.practice as string) || PRACTICE_ALL);

const PAGE_SIZE = 25;
const parsedInitialPage = parseInt((route.query.page as string) ?? '1', 10);
const initialPage = Number.isFinite(parsedInitialPage) && parsedInitialPage > 0 ? parsedInitialPage : 1;

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
  if (user.value?.role === 'USER') opts.push({ label: 'Assigned to me', value: ASSIGNEE_ME });
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

const {
  items: cases,
  total: totalCases,
  page,
  isLoading: isLoadingCases,
  refresh: refreshCases,
} = usePaginatedQuery<ApiCase>(
  '/api/cases',
  () => ({
    status: statusFilter.value,
    assignedToId: isLabUser.value && assigneeFilter.value !== ASSIGNEE_ALL ? assigneeFilter.value : undefined,
    caseTypeId: caseTypeFilter.value !== TYPE_ALL ? caseTypeFilter.value : undefined,
    practiceId: isLabUser.value && practiceFilter.value !== PRACTICE_ALL ? practiceFilter.value : undefined,
  }),
  { pageSize: PAGE_SIZE, initialPage }
);

watch([statusFilter, assigneeFilter, caseTypeFilter, practiceFilter], () => {
  page.value = 1;
});

watch([statusFilter, assigneeFilter, caseTypeFilter, practiceFilter, page], ([s, a, t, p, pg]) => {
  const query: Record<string, string> = {};
  query.status = s;
  if (a !== ASSIGNEE_ALL) query.assignee = a;
  if (t !== TYPE_ALL) query.caseType = t;
  if (p !== PRACTICE_ALL) query.practice = p;
  if (pg && pg > 1) query.page = String(pg);
  router.replace({ query });
});

const zeroCounts = (): Record<CaseStatusName, number> => ({
  DRAFT: 0,
  SUBMITTED: 0,
  NEEDS_INFO: 0,
  ACCEPTED: 0,
  IN_PROGRESS: 0,
  COMPLETED: 0,
  CANCELLED: 0,
});

const countsQuery = computed(() => ({
  assignedToId: isLabUser.value && assigneeFilter.value !== ASSIGNEE_ALL ? assigneeFilter.value : undefined,
  caseTypeId: caseTypeFilter.value !== TYPE_ALL ? caseTypeFilter.value : undefined,
  practiceId: isLabUser.value && practiceFilter.value !== PRACTICE_ALL ? practiceFilter.value : undefined,
}));

const { data: rawStatusCounts, refresh: refreshCounts } = useFetch<Record<CaseStatusName, number>>(
  '/api/cases/status-counts',
  {
    query: countsQuery,
    lazy: true,
    default: zeroCounts,
  }
);

// Tabs use 6 buckets; ACCEPTED is folded into IN_PROGRESS to match the server's IN_PROGRESS filter.
const statusCounts = computed(() => {
  const counts = rawStatusCounts.value ?? zeroCounts();
  return {
    DRAFT: counts.DRAFT,
    SUBMITTED: counts.SUBMITTED,
    NEEDS_INFO: counts.NEEDS_INFO,
    IN_PROGRESS: counts.ACCEPTED + counts.IN_PROGRESS,
    COMPLETED: counts.COMPLETED,
    CANCELLED: counts.CANCELLED,
  };
});

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
        const meta = CASE_STATUS_META[status];
        const variant = status === 'NEEDS_INFO' ? 'solid' : 'subtle';
        const downloadCount = row.original._count?.events ?? 0;
        return h('div', { class: 'flex items-center gap-1' }, [
          h(UBadge, { color: meta.color, variant, label: meta.label }),
          downloadCount > 0
            ? h(UTooltip, { text: 'Files downloaded by lab' }, () =>
                h(UIcon, { name: 'i-ri-download-cloud-line', class: 'h-4 w-4 text-success' })
              )
            : null,
        ]);
      },
    },
    {
      accessorKey: 'fileTypes',
      header: 'Files',
      cell: ({ row }) => {
        const types = row.original.fileTypes ?? [];
        if (types.length === 0) return h('span', { class: 'text-xs text-muted italic' }, '—');
        return h(
          'div',
          { class: 'flex flex-wrap gap-1' },
          types.map((t) => h(UBadge, { variant: 'subtle', color: 'neutral', size: 'xs' }, () => `.${t}`))
        );
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
        return h('div', { class: 'flex items-center gap-2' }, [
          h(UAvatar, { src: assignee.avatarUrl ?? undefined, alt: assignee.name, size: '2xs' }),
          h('span', { class: 'text-sm text-gray-700 dark:text-gray-300' }, assignee.name),
        ]);
      },
    });
  }

  cols.push(
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => h('span', { class: 'text-sm' }, formatDate(row.original.createdAt)),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, formatDate(row.original.updatedAt)),
    }
  );

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
  refreshCounts();
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

const caseIdFromQuery = route.query.caseId as string | undefined;
if (caseIdFromQuery) {
  openCaseDetail(caseIdFromQuery);
}

watch(
  () => route.query.caseId,
  (caseId) => {
    if (caseId) {
      viewingCaseId.value = caseId as string;
      nextTick(() => {
        caseDetailRef.value?.open();
      });
    }
  }
);

watch(viewingCaseId, (val) => {
  if (!val && route.query.caseId) {
    const query = { ...route.query };
    delete query.caseId;
    router.replace({ query });
  }
});

const onEditFromDetail = (caseId: string) => {
  viewingCaseId.value = null;
  openEditWizard(caseId);
};

const deleteDraftMutation = useApiMutation('Failed to delete draft');

const deleteDraftCase = async (caseId: string) => {
  if (!confirm('Are you sure you want to delete this draft?')) return;
  const ok = await deleteDraftMutation.mutate(`/api/cases/${caseId}`, { method: 'DELETE' });
  if (ok !== null) refreshAll();
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
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-semibold">Cases</h1>
          <PortalCaseWizard v-if="canCreateCase" @success="refreshAll">
            <UButton icon="i-ri-upload-2-line" color="primary">Upload New Case</UButton>
          </PortalCaseWizard>
        </div>
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
            <PortalTableSkeleton v-if="isLoadingCases && cases.length === 0" :rows="8" :columns="columns.length" />
            <UTable v-else :data="cases" :columns="columns" :ui="{ tr: 'cursor-pointer' }" @select="onRowSelect">
              <template #empty>
                <div class="flex flex-col items-center justify-center py-16">
                  <div
                    class="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
                  >
                    <UIcon
                      :name="statusTabs.find((t) => t.value === statusFilter)?.icon || 'i-ri-folder-line'"
                      class="h-8 w-8 text-gray-400"
                    />
                  </div>
                  <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    No {{ statusTabs.find((t) => t.value === statusFilter)?.label.toLowerCase() }}
                  </h3>
                  <p class="mb-2 max-w-sm text-center text-gray-500">
                    There are no cases with this status. Try selecting a different tab.
                  </p>
                  <PortalCaseWizard v-if="canCreateCase" @success="refreshAll">
                    <UButton icon="i-ri-upload-2-line" color="primary">Upload New Case</UButton>
                  </PortalCaseWizard>
                </div>
              </template>
            </UTable>
          </UCard>

          <div class="mt-3 flex justify-end">
            <UPagination v-model:page="page" :total="totalCases" :items-per-page="PAGE_SIZE" />
          </div>
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
        /></div
    ></template>
  </UDashboardPanel>
</template>
