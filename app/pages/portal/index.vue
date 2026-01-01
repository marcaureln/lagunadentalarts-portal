<script setup lang="ts">
import { h } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { permissions } from '~~/shared/utils/permissions';

const { user } = useUserSession();

definePageMeta({
  layout: 'portal',
});

const UBadge = resolveComponent('UBadge');

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

// Fetch cases from API
const { data: casesData, refresh: refreshCases } = await useFetch<ApiCase[]>('/api/cases');

const cases = computed(() => casesData.value || []);

const statusCounts = computed(() => ({
  DRAFT: cases.value.filter((c) => c.status === 'DRAFT').length,
  SUBMITTED: cases.value.filter((c) => c.status === 'SUBMITTED').length,
  IN_PROGRESS: cases.value.filter((c) => ['ACCEPTED', 'IN_PROGRESS'].includes(c.status)).length,
  COMPLETED: cases.value.filter((c) => c.status === 'COMPLETED').length,
}));

type DashboardStatus = 'DRAFT' | 'SUBMITTED' | 'IN_PROGRESS' | 'COMPLETED';

const statusConfig: Record<DashboardStatus, { color: string; icon: string; label: string }> = {
  DRAFT: { color: 'neutral', icon: 'i-ri-draft-line', label: 'Draft' },
  SUBMITTED: { color: 'primary', icon: 'i-ri-send-plane-line', label: 'Submitted' },
  IN_PROGRESS: { color: 'warning', icon: 'i-ri-loader-4-line', label: 'In Progress' },
  COMPLETED: { color: 'success', icon: 'i-ri-checkbox-circle-line', label: 'Completed' },
};

const allStatusConfig = {
  DRAFT: { color: 'neutral', label: 'Draft' },
  SUBMITTED: { color: 'primary', label: 'Submitted' },
  NEEDS_INFO: { color: 'warning', label: 'Needs Info' },
  ACCEPTED: { color: 'info', label: 'Accepted' },
  IN_PROGRESS: { color: 'warning', label: 'In Progress' },
  COMPLETED: { color: 'success', label: 'Completed' },
  CANCELLED: { color: 'error', label: 'Cancelled' },
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
        return h(UBadge, { color: config.color, variant: 'subtle', label: config.label });
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return h('span', { class: 'text-sm' }, new Date(date).toLocaleDateString());
      },
    }
  );

  return cols;
});
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
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UCard v-for="(config, status) in statusConfig" :key="status">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-muted text-sm">{{ config.label }}</p>
                <p class="mt-1 text-2xl font-semibold">{{ statusCounts[status] }}</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-lg" :class="`bg-${config.color}/10`">
                <UIcon :name="config.icon" class="h-6 w-6" :class="`text-${config.color}`" />
              </div>
            </div>
          </UCard>
        </div>

        <!-- Cases Table -->
        <UCard :ui="{ body: 'p-0!' }">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Recent Cases</h2>
              <UButton variant="ghost" color="neutral" size="sm" trailing-icon="i-ri-arrow-right-line">
                View All
              </UButton>
            </div>
          </template>

          <UTable :data="cases" :columns="columns">
            <template #empty-state>
              <div class="flex flex-col items-center justify-center py-12">
                <UIcon name="i-ri-folder-line" class="mb-4 h-12 w-12 text-gray-400" />
                <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No cases found</h3>
                <p v-if="canCreateCase" class="mb-4 text-gray-500">Get started by uploading a new case.</p>
                <p v-else class="text-gray-500">Cases submitted by practices will appear here.</p>
                <UButton v-if="canCreateCase" icon="i-ri-upload-2-line" color="primary"> Upload New Case </UButton>
              </div>
            </template>
          </UTable>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
