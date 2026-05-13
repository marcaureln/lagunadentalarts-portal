<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { useSortable } from '@vueuse/integrations/useSortable';
import { permissions } from '~~/shared/utils/permissions';
import { formatDate } from '~~/shared/utils/format';
import { useApiMutation } from '~~/app/composables/useApiMutation';

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

const {
  data: fetchedData,
  refresh,
  status,
} = useFetch<ApiResource[]>('/api/resources', {
  key: 'resources-list',
  lazy: true,
  default: () => [],
});

// useSortable needs a writable array ref it can mutate in place when rows are dragged.
const resources = ref<ApiResource[]>([]);
watch(
  fetchedData,
  (v) => {
    resources.value = v ? [...v] : [];
  },
  { immediate: true }
);

const isLoading = computed(() => status.value === 'pending');

const reorderMutation = useApiMutation('Failed to save new order');

const persistOrder = async () => {
  // VueUse's default onUpdate applies the move in a nextTick; wait for it.
  await nextTick();
  const ok = await reorderMutation.mutate('/api/admin/resources/reorder', {
    method: 'POST',
    body: { orderedIds: resources.value.map((r) => r.id) },
  });
  if (ok !== null) {
    // Invalidate the shared cache so the public /resources page reflects the new order.
    await refreshNuxtData('resources-list');
  } else {
    refresh();
  }
};

const tbodyEl = ref<HTMLElement | null>(null);
const { start, stop } = useSortable(tbodyEl, resources, {
  animation: 150,
  handle: '.drag-handle',
  onEnd: (e) => {
    if (e.oldIndex === e.newIndex) return;
    persistOrder();
  },
});

// useSortable's onMounted runs before the tbody exists (v-if while loading).
// Attach as soon as the table renders; re-attach across nav back/forth.
watch(
  () => !isLoading.value && resources.value.length > 0,
  (ready) => {
    if (ready) {
      nextTick(() => {
        tbodyEl.value = document.querySelector<HTMLElement>('.resources-tbody');
        start();
      });
    } else {
      stop();
      tbodyEl.value = null;
    }
  },
  { immediate: true }
);

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

const deleteResourceMutation = useApiMutation('Failed to delete resource');

const deleteResource = async (resource: ApiResource) => {
  if (!confirm(`Delete "${resource.title}"? This cannot be undone.`)) return;
  const ok = await deleteResourceMutation.mutate(`/api/admin/resources/${resource.id}`, { method: 'DELETE' });
  if (ok !== null) refresh();
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const UButton = resolveComponent('UButton');

const columns: TableColumn<ApiResource>[] = [
  {
    id: 'handle',
    enableHiding: false,
    meta: { class: { th: 'w-6', td: 'w-6' } },
    cell: () =>
      h(
        'span',
        { class: 'drag-handle flex cursor-grab items-center justify-center text-muted active:cursor-grabbing' },
        [h(resolveComponent('UIcon'), { name: 'i-ri-draggable', class: 'h-4 w-4' })]
      ),
  },
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
    accessorKey: 'uploadedBy',
    header: 'Uploaded By',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, row.original.uploadedBy?.name ?? '-'),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, formatDate(row.original.updatedAt)),
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
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-semibold">Manage Resources</h1>
          <UButton color="primary" icon="i-ri-add-line" @click="openAdd">Add Resource</UButton>
        </div>
        <UCard :ui="{ body: 'p-0!' }">
          <PortalTableSkeleton v-if="isLoading && resources.length === 0" :rows="6" :columns="columns.length" />
          <UTable v-else :data="resources" :columns="columns" :ui="{ tbody: 'resources-tbody' }">
            <template #empty>
              <div class="flex flex-col items-center justify-center py-16">
                <div class="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <UIcon name="i-ri-folder-download-line" class="h-8 w-8 text-gray-400" />
                </div>
                <h3 class="mb-2 text-lg font-semibold">No resources yet</h3>
                <p class="mb-2 max-w-sm text-center text-gray-500">
                  Upload printable forms or reference documents that practices can download.
                </p>
                <UButton color="primary" icon="i-ri-add-line" @click="openAdd">Add Resource</UButton>
              </div>
            </template>
          </UTable>
        </UCard>

        <PortalAdminModalResource ref="addRef" @success="onSuccess" />
        <PortalAdminModalResource v-if="editing" ref="editRef" :resource="editing" @success="onSuccess" /></div
    ></template>
  </UDashboardPanel>
</template>
