<script setup lang="ts">
import { h } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import { permissions, type CaseStatusName } from '~~/shared/utils/permissions';
import { formatDate } from '~~/shared/utils/format';
import { CASE_STATUS_META } from '~~/shared/utils/caseStatus';
import { useApiMutation } from '~~/app/composables/useApiMutation';

const { user } = useUserSession();

useSeoMeta({ title: 'Home' });

const UBadge = resolveComponent('UBadge');
const UButton = resolveComponent('UButton');
const UDropdownMenu = resolveComponent('UDropdownMenu');

const canCreateCase = computed(() => permissions.canCreateCase(user.value?.role));
const isPracticeUser = computed(() => ['PRACTICE_STAFF', 'PRACTICE_ADMIN'].includes(user.value?.role || ''));

interface ApiCase {
  id: string;
  patientName: string;
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_INFO' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  practice: { id: string; name: string };
  caseType: { id: string; key: string; label: string };
  createdBy: { id: string; name: string };
}

// Recent cases limit selector
const recentCasesLimit = ref(5);
const limitOptions = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '20', value: 20 },
];

const {
  data: casesData,
  refresh: refreshCases,
  status: casesStatus,
} = useFetch<ApiCase[]>('/api/cases', {
  query: computed(() => ({ limit: recentCasesLimit.value })),
  lazy: true,
  default: () => [],
});

const cases = computed(() => casesData.value || []);
const isLoadingCases = computed(() => casesStatus.value === 'pending');

const zeroCounts = (): Record<CaseStatusName, number> => ({
  DRAFT: 0,
  SUBMITTED: 0,
  NEEDS_INFO: 0,
  ACCEPTED: 0,
  IN_PROGRESS: 0,
  COMPLETED: 0,
  CANCELLED: 0,
});

const { data: rawStatusCounts } = useFetch<Record<CaseStatusName, number>>('/api/cases/status-counts', {
  lazy: true,
  default: zeroCounts,
});

// Dashboard folds ACCEPTED + IN_PROGRESS into one "In Progress" bucket.
const statusCounts = computed(() => {
  const counts = rawStatusCounts.value ?? zeroCounts();
  return {
    DRAFT: counts.DRAFT,
    SUBMITTED: counts.SUBMITTED,
    IN_PROGRESS: counts.ACCEPTED + counts.IN_PROGRESS,
    COMPLETED: counts.COMPLETED,
  };
});

type DashboardStatus = 'DRAFT' | 'SUBMITTED' | 'IN_PROGRESS' | 'COMPLETED';

interface DashboardCard {
  status: DashboardStatus;
  color: string;
  icon: string;
  label: string;
}

const isLabUser = computed(() => permissions.isLabUser(user.value?.role));

const dashboardCards = computed<DashboardCard[]>(() => {
  const cards: DashboardCard[] = [];
  if (!isLabUser.value) {
    cards.push({ status: 'DRAFT', color: 'neutral', icon: 'i-ri-draft-line', label: 'Draft' });
  }
  cards.push(
    isLabUser.value
      ? { status: 'SUBMITTED', color: 'primary', icon: 'i-ri-inbox-line', label: 'Inbox' }
      : { status: 'SUBMITTED', color: 'primary', icon: 'i-ri-send-plane-line', label: 'Submitted' }
  );
  cards.push({ status: 'IN_PROGRESS', color: 'warning', icon: 'i-ri-loader-4-line', label: 'In Progress' });
  cards.push({ status: 'COMPLETED', color: 'success', icon: 'i-ri-checkbox-circle-line', label: 'Completed' });
  return cards;
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

  // Only show practice column for lab users
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
        return h(UBadge, { color: meta.color, variant: 'subtle', label: meta.label });
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        return h('span', { class: 'text-sm' }, formatDate(row.original.createdAt));
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

  // Add actions column for practice users
  if (isPracticeUser.value) {
    cols.push({
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const caseData = row.original;
        const items = [];

        // Only show actions for draft cases for now
        // TODO: Add 'View details' action for non-draft cases (case detail page)
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
        }

        // Don't render dropdown if no items
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

// Edit wizard state
const editingCaseId = ref<string | null>(null);
const editWizardRef = ref<{ open: () => void } | null>(null);

const openEditWizard = (caseId: string) => {
  editingCaseId.value = caseId;
  nextTick(() => {
    editWizardRef.value?.open();
  });
};

const onEditWizardSuccess = () => {
  editingCaseId.value = null;
  refreshCases();
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

const deleteDraftMutation = useApiMutation('Failed to delete draft');

const deleteDraftCase = async (caseId: string) => {
  if (!confirm('Are you sure you want to delete this draft?')) return;
  const ok = await deleteDraftMutation.mutate(`/api/cases/${caseId}`, { method: 'DELETE' });
  if (ok !== null) await refreshCases();
};

const onRowSelect = (_e: Event, row: TableRow<ApiCase>) => {
  const caseData = row.original;
  if (caseData.status === 'DRAFT' && isPracticeUser.value) {
    openEditWizard(caseData.id);
  } else {
    openCaseDetail(caseData.id);
  }
};
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="`Welcome back, ${user?.name}!`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <PortalCaseWizard v-if="canCreateCase" @success="refreshCases">
            <UButton icon="i-ri-upload-2-line" color="primary"> Upload New Case </UButton>
          </PortalCaseWizard>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Status Cards -->
        <div
          class="grid gap-4 sm:grid-cols-2"
          :class="dashboardCards.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'"
        >
          <UCard v-for="card in dashboardCards" :key="card.status">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">{{ card.label }}</p>
                <p class="mt-1 text-2xl font-semibold">{{ statusCounts[card.status] }}</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-lg" :class="`bg-${card.color}/10`">
                <UIcon :name="card.icon" class="h-6 w-6" :class="`text-${card.color}`" />
              </div>
            </div>
          </UCard>
        </div>

        <!-- Cases Table -->
        <UCard :ui="{ body: 'p-0!' }">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Recent Cases</h2>
              <UButton to="/cases" variant="ghost" color="neutral" size="sm" trailing-icon="i-ri-arrow-right-line">
                View All
              </UButton>
            </div>
          </template>

          <div v-if="isLoadingCases && cases.length === 0" class="flex items-center justify-center py-12">
            <UIcon name="i-ri-loader-4-line" class="h-6 w-6 animate-spin text-primary" />
          </div>
          <UTable
            v-else
            :data="cases"
            :columns="columns"
            sticky
            class="max-h-96"
            :ui="{ tr: 'cursor-pointer' }"
            @select="onRowSelect"
          >
            <template #empty>
              <div class="flex flex-col items-center justify-center py-12">
                <UIcon name="i-ri-folder-line" class="mb-4 h-12 w-12 text-gray-400" />
                <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No cases found</h3>
                <p v-if="canCreateCase" class="mb-4 text-gray-500">Get started by uploading a new case.</p>
                <p v-else class="text-gray-500">Cases submitted by practices will appear here.</p>
                <UButton v-if="canCreateCase" icon="i-ri-upload-2-line" color="primary"> Upload New Case </UButton>
              </div>
            </template>
          </UTable>

          <template #footer>
            <div class="flex items-center justify-end gap-2">
              <span class="text-sm text-muted">Show</span>
              <USelectMenu v-model="recentCasesLimit" :items="limitOptions" value-key="value" class="w-20" size="xs" />
            </div>
          </template>
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
      />
    </template>
  </UDashboardPanel>
</template>
