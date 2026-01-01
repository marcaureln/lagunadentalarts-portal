<script setup lang="ts">
import { h } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import { permissions } from '~~/shared/utils/permissions';

const { user } = useUserSession();
const route = useRoute();
const router = useRouter();

definePageMeta({
  layout: 'portal',
});

const UBadge = resolveComponent('UBadge');
const UButton = resolveComponent('UButton');
const UDropdownMenu = resolveComponent('UDropdownMenu');

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

// Status filter
type StatusFilter = 'all' | 'DRAFT' | 'SUBMITTED' | 'NEEDS_INFO' | 'IN_PROGRESS' | 'COMPLETED';

const statusFilter = ref<StatusFilter>((route.query.status as StatusFilter) || 'all');

const statusTabs = [
  { value: 'all', label: 'All Cases', icon: 'i-ri-list-check' },
  { value: 'DRAFT', label: 'Drafts', icon: 'i-ri-draft-line' },
  { value: 'SUBMITTED', label: 'Submitted', icon: 'i-ri-send-plane-line' },
  { value: 'NEEDS_INFO', label: 'Needs Info', icon: 'i-ri-error-warning-line' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: 'i-ri-loader-4-line' },
  { value: 'COMPLETED', label: 'Completed', icon: 'i-ri-checkbox-circle-line' },
] as const;

// Update URL when filter changes
watch(statusFilter, (newStatus) => {
  router.replace({
    query: newStatus === 'all' ? {} : { status: newStatus },
  });
});

// Fetch cases from API with status filter
const { data: casesData, refresh: refreshCases } = await useFetch<ApiCase[]>('/api/cases', {
  query: computed(() => ({
    status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
  })),
});

const cases = computed(() => casesData.value || []);

// Status counts for badges
const { data: allCasesData } = await useFetch<ApiCase[]>('/api/cases');
const statusCounts = computed(() => {
  const all = allCasesData.value || [];
  return {
    all: all.length,
    DRAFT: all.filter((c) => c.status === 'DRAFT').length,
    SUBMITTED: all.filter((c) => c.status === 'SUBMITTED').length,
    NEEDS_INFO: all.filter((c) => c.status === 'NEEDS_INFO').length,
    IN_PROGRESS: all.filter((c) => ['ACCEPTED', 'IN_PROGRESS'].includes(c.status)).length,
    COMPLETED: all.filter((c) => c.status === 'COMPLETED').length,
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
        const config = allStatusConfig[status];
        // Highlight NEEDS_INFO with solid variant
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

  // Add actions column for practice users
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

// Case detail modal state
const viewingCaseId = ref<string | null>(null);
const caseDetailRef = ref<{ open: () => void } | null>(null);

const openCaseDetail = (caseId: string) => {
  viewingCaseId.value = caseId;
  nextTick(() => {
    caseDetailRef.value?.open();
  });
};

const deleteDraftCase = async (caseId: string) => {
  if (!confirm('Are you sure you want to delete this draft?')) return;

  try {
    await $fetch(`/api/cases/${caseId}`, { method: 'DELETE' });
    await refreshCases();
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
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Cases">
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
        <!-- Status Filter Tabs -->
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

        <!-- Cases Table -->
        <UCard :ui="{ body: 'p-0!' }">
          <UTable :data="cases" :columns="columns" @select="onRowSelect">
            <template #empty-state>
              <div class="flex flex-col items-center justify-center py-12">
                <UIcon name="i-ri-folder-line" class="mb-4 h-12 w-12 text-gray-400" />
                <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                  {{
                    statusFilter === 'all'
                      ? 'No cases found'
                      : `No ${statusTabs.find((t) => t.value === statusFilter)?.label.toLowerCase()}`
                  }}
                </h3>
                <p v-if="canCreateCase && statusFilter === 'all'" class="mb-4 text-gray-500">
                  Get started by uploading a new case.
                </p>
                <p v-else-if="statusFilter !== 'all'" class="text-gray-500">No cases match the selected filter.</p>
              </div>
            </template>
          </UTable>
        </UCard>
      </div>

      <!-- Edit Wizard (hidden trigger, opened programmatically) -->
      <PortalCaseWizard
        v-if="editingCaseId"
        ref="editWizardRef"
        :case-id="editingCaseId"
        @success="onEditWizardSuccess"
      />

      <!-- Case Detail Modal (TODO: implement component) -->
      <PortalCaseDetailModal
        v-if="viewingCaseId"
        ref="caseDetailRef"
        :case-id="viewingCaseId"
        @close="viewingCaseId = null"
      />
    </template>
  </UDashboardPanel>
</template>
