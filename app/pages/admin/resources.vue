<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { permissions } from '~~/shared/utils/permissions';

const { user } = useUserSession();

useSeoMeta({ title: 'Manage Resources' });

if (!permissions.canManageResources(user.value?.role)) {
  await navigateTo('/resources');
}

interface ApiResource {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  uploadedBy: { id: string; name: string };
}

const { data, refresh, status } = useFetch<ApiResource[]>('/api/resources', {
  lazy: true,
  default: () => [],
});

const resources = computed(() => data.value || []);
const isLoading = computed(() => status.value === 'pending');

const addRef = ref<{ open: () => void } | null>(null);
const editing = ref<ApiResource | null>(null);
const editRef = ref<{ open: () => void } | null>(null);

const openAdd = () => addRef.value?.open();
const openEdit = (resource: ApiResource) => {
  editing.value = resource;
  nextTick(() => editRef.value?.open());
};
const onSuccess = () => {
  editing.value = null;
  refresh();
};

const deleteResource = async (resource: ApiResource) => {
  if (!confirm(`Delete "${resource.title}"? This cannot be undone.`)) return;
  try {
    await $fetch(`/api/admin/resources/${resource.id}`, { method: 'DELETE' });
    refresh();
  } catch (e) {
    console.error('Failed to delete resource', e);
  }
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const UButton = resolveComponent('UButton');

const columns: TableColumn<ApiResource>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.title),
  },
  {
    accessorKey: 'fileName',
    header: 'File',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, row.original.fileName),
  },
  {
    accessorKey: 'fileSize',
    header: 'Size',
    cell: ({ row }) => h('span', { class: 'text-sm' }, formatBytes(row.original.fileSize)),
  },
  {
    accessorKey: 'sortOrder',
    header: 'Sort',
    cell: ({ row }) => h('span', { class: 'text-sm tabular-nums' }, String(row.original.sortOrder)),
  },
  {
    accessorKey: 'uploadedBy',
    header: 'Uploaded By',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, row.original.uploadedBy?.name ?? '-'),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    cell: ({ row }) =>
      h('span', { class: 'text-sm text-muted' }, new Date(row.original.updatedAt).toLocaleDateString()),
  },
  {
    id: 'actions',
    enableHiding: false,
    meta: { class: { td: 'w-fit' } },
    cell: ({ row }) =>
      h('div', { class: 'flex justify-end gap-1' }, [
        h(UButton, {
          icon: 'i-ri-download-line',
          variant: 'ghost',
          color: 'neutral',
          size: 'sm',
          to: `/api/resources/${row.original.id}/download`,
          external: true,
          download: true,
          'aria-label': 'Download',
        }),
        h(UButton, {
          icon: 'i-ri-edit-line',
          variant: 'ghost',
          color: 'neutral',
          size: 'sm',
          'aria-label': 'Edit',
          onClick: () => openEdit(row.original),
        }),
        h(UButton, {
          icon: 'i-ri-delete-bin-line',
          variant: 'ghost',
          color: 'error',
          size: 'sm',
          'aria-label': 'Delete',
          onClick: () => deleteResource(row.original),
        }),
      ]),
  },
];
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Manage Resources">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton color="primary" icon="i-ri-add-line" @click="openAdd">Add Resource</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard :ui="{ body: 'p-0!' }">
        <div v-if="isLoading && resources.length === 0" class="flex items-center justify-center py-16">
          <UIcon name="i-ri-loader-4-line" class="h-6 w-6 animate-spin text-primary" />
        </div>
        <UTable v-else :data="resources" :columns="columns">
          <template #empty>
            <div class="flex flex-col items-center justify-center py-16">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <UIcon name="i-ri-folder-download-line" class="h-8 w-8 text-gray-400" />
              </div>
              <h3 class="mb-2 text-lg font-semibold">No resources yet</h3>
              <p class="mb-6 max-w-sm text-center text-gray-500">
                Upload printable forms or reference documents that practices can download.
              </p>
              <UButton color="primary" icon="i-ri-add-line" @click="openAdd">Add Resource</UButton>
            </div>
          </template>
        </UTable>
      </UCard>

      <PortalAdminModalResource ref="addRef" @success="onSuccess" />
      <PortalAdminModalResource v-if="editing" ref="editRef" :resource="editing" @success="onSuccess" />
    </template>
  </UDashboardPanel>
</template>
