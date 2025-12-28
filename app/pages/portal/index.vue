<script setup lang="ts">
import { h } from 'vue';
import type { TableColumn } from '@nuxt/ui';

const { user } = useUserSession();

definePageMeta({
  layout: 'portal',
});

interface Case {
  id: string;
  patientName: string;
  caseType: string;
  status: 'open' | 'pending' | 'closed' | 'canceled';
  practice: string;
  createdAt: Date;
  dueDate: Date;
}

// Mock data
const cases = ref<Case[]>([
  {
    id: 'CASE-001',
    patientName: 'John Smith',
    caseType: 'Crown & Bridge',
    status: 'open',
    practice: 'Downtown Dental',
    createdAt: new Date('2024-12-20'),
    dueDate: new Date('2024-12-30'),
  },
  {
    id: 'CASE-002',
    patientName: 'Sarah Johnson',
    caseType: 'Implant Supported',
    status: 'pending',
    practice: 'Smile Center',
    createdAt: new Date('2024-12-22'),
    dueDate: new Date('2025-01-05'),
  },
  {
    id: 'CASE-003',
    patientName: 'Michael Brown',
    caseType: 'Orthodontics',
    status: 'closed',
    practice: 'Downtown Dental',
    createdAt: new Date('2024-12-15'),
    dueDate: new Date('2024-12-25'),
  },
  {
    id: 'CASE-004',
    patientName: 'Emily Davis',
    caseType: 'Removable',
    status: 'open',
    practice: 'Bright Smiles',
    createdAt: new Date('2024-12-23'),
    dueDate: new Date('2025-01-02'),
  },
  {
    id: 'CASE-005',
    patientName: 'David Wilson',
    caseType: 'Crown & Bridge',
    status: 'canceled',
    practice: 'Smile Center',
    createdAt: new Date('2024-12-18'),
    dueDate: new Date('2024-12-28'),
  },
]);

const statusCounts = computed(() => ({
  open: cases.value.filter((c) => c.status === 'open').length,
  pending: cases.value.filter((c) => c.status === 'pending').length,
  closed: cases.value.filter((c) => c.status === 'closed').length,
  canceled: cases.value.filter((c) => c.status === 'canceled').length,
}));

const statusConfig = {
  open: { color: 'primary', icon: 'i-ri-folder-open-line', label: 'Open' },
  pending: { color: 'warning', icon: 'i-ri-time-line', label: 'Pending' },
  closed: { color: 'success', icon: 'i-ri-checkbox-circle-line', label: 'Closed' },
  canceled: { color: 'error', icon: 'i-ri-close-circle-line', label: 'Canceled' },
} as const;

const columns: TableColumn<Case>[] = [
  {
    accessorKey: 'id',
    header: 'Case ID',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.getValue('id')),
  },
  {
    accessorKey: 'patientName',
    header: 'Patient',
    cell: ({ row }) => h('span', {}, row.getValue('patientName')),
  },
  {
    accessorKey: 'caseType',
    header: 'Type',
    cell: ({ row }) => h('span', { class: 'text-gray-600' }, row.getValue('caseType')),
  },
  {
    accessorKey: 'practice',
    header: 'Practice',
    cell: ({ row }) => h('span', { class: 'text-gray-600' }, row.getValue('practice')),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as Case['status'];
      const config = statusConfig[status];
      return h('UBadge', { color: config.color, variant: 'subtle' }, () => config.label);
    },
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => {
      const date = row.getValue('dueDate') as Date;
      return h('span', { class: 'text-sm' }, date.toLocaleDateString());
    },
  },
];
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="`Welcome back, ${user?.name}!`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-ri-upload-2-line" color="primary"> Upload New Case </UButton>
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
        <UCard>
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
                <h3 class="mb-2 text-lg font-medium text-gray-900">No cases found</h3>
                <p class="mb-4 text-gray-500">Get started by uploading a new case.</p>
                <UButton icon="i-ri-upload-2-line" color="primary"> Upload New Case </UButton>
              </div>
            </template>
          </UTable>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
