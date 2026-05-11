<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { PracticeWithCount } from '~~/shared/types/practice';

const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');
const UTooltip = resolveComponent('UTooltip');
const PortalAdminPracticeFormModal = resolveComponent('PortalAdminPracticeFormModal');

useSeoMeta({ title: 'Practice Management' });

const { data: practices, refresh } = await useFetch<PracticeWithCount[]>('/api/practices');

const router = useRouter();
const toast = useToast();
const table = useTemplateRef('table');

async function deletePractice(practice: PracticeWithCount) {
  const confirmed = confirm(`Are you sure you want to delete "${practice.name}"?`);
  if (!confirmed) return;

  try {
    await $fetch(`/api/practices/${practice.id}`, {
      method: 'DELETE',
    });

    toast.add({
      description: 'Practice deleted successfully',
      color: 'success',
    });

    refresh();
  } catch (e: unknown) {
    console.error(e);
    toast.add({
      description: 'Failed to delete practice',
      color: 'error',
    });
  }
}

function viewPracticeUsers(practice: PracticeWithCount) {
  router.push(`/admin/practices/${practice.id}/users`);
}

const onRowSelect = (_e: Event, row: TableRow<PracticeWithCount>) => {
  viewPracticeUsers(row.original);
};

const columns: TableColumn<PracticeWithCount>[] = [
  {
    accessorKey: 'name',
    header: 'Practice Name',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.getValue('name')),
  },
  {
    accessorKey: 'address',
    header: 'Address',
    cell: ({ row }) => h('span', { class: 'text-gray-600' }, row.getValue('address') || '—'),
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => h('span', { class: 'text-gray-600' }, row.getValue('phone') || '—'),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => h('span', { class: 'text-gray-600' }, row.getValue('email') || '—'),
  },
  {
    accessorKey: 'staff',
    header: 'Staff',
    cell: ({ row }) => {
      const count = row.original._count?.staff || 0;
      return h(UBadge, { variant: 'subtle', color: count > 0 ? 'primary' : 'neutral' }, () => count.toString());
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right' }, 'Actions'),
    enableHiding: false,
    cell: ({ row }) => {
      const practice = row.original;
      return h('div', { class: 'flex items-center justify-end gap-1', onClick: (e: Event) => e.stopPropagation() }, [
        h(UTooltip, { text: 'View Users' }, () =>
          h(UButton, {
            variant: 'ghost',
            color: 'neutral',
            icon: 'i-ri-team-line',
            size: 'sm',
            onClick: () => viewPracticeUsers(practice),
          })
        ),
        h(PortalAdminPracticeFormModal, {
          practice,
          onSuccess: refresh,
        }),
        h(UTooltip, { text: 'Delete' }, () =>
          h(UButton, {
            variant: 'ghost',
            color: 'neutral',
            icon: 'i-ri-delete-bin-line',
            size: 'sm',
            onClick: () => deletePractice(practice),
          })
        ),
      ]);
    },
  },
];
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Practice Management">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <PortalAdminPracticeFormModal @success="refresh" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full flex-1 divide-y divide-accented overflow-hidden rounded-lg border border-accented">
        <UTable ref="table" :data="practices || []" :columns="columns" @select="onRowSelect">
          <template #empty>
            <div class="flex flex-col items-center justify-center py-12">
              <UIcon name="i-ri-building-line" class="mb-4 h-12 w-12 text-gray-400" />
              <h3 class="mb-2 text-lg font-medium text-gray-900">No practices found</h3>
              <p class="mb-4 max-w-sm text-center text-gray-500">Get started by adding a new practice.</p>
              <PortalAdminPracticeFormModal @success="refresh" />
            </div>
          </template>
        </UTable>
      </div>
    </template>
  </UDashboardPanel>
</template>
