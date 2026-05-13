<script setup lang="ts">
import { permissions } from '~~/shared/utils/permissions';

const { user } = useUserSession();

useSeoMeta({ title: 'Resources' });

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

const { data, status } = useFetch<ApiResource[]>('/api/resources', {
  key: 'resources-list',
  lazy: true,
  default: () => [],
});

const resources = computed(() => data.value || []);
const isLoading = computed(() => status.value === 'pending');
const canManage = computed(() => permissions.canManageResources(user.value?.role));

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const iconFor = (mime: string) => {
  if (mime.startsWith('image/')) return 'i-ri-image-line';
  if (mime === 'application/pdf') return 'i-ri-file-pdf-line';
  if (mime.includes('spreadsheet')) return 'i-ri-file-excel-line';
  if (mime.includes('wordprocessing')) return 'i-ri-file-word-line';
  return 'i-ri-file-line';
};
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="flex flex-col gap-4">
        <h1 class="text-2xl font-semibold">Resources</h1>
        <div v-if="isLoading && resources.length === 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 3" :key="i" class="space-y-3 rounded-lg border border-default p-4">
            <div class="flex items-start gap-3">
              <div class="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-elevated" />
              <div class="flex-1 space-y-2">
                <div class="h-4 w-3/4 animate-pulse rounded bg-elevated" />
                <div class="h-3 w-full animate-pulse rounded bg-elevated" />
              </div>
            </div>
            <div class="h-8 w-full animate-pulse rounded bg-elevated" />
          </div>
        </div>

        <div v-else-if="resources.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
          <div class="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <UIcon name="i-ri-folder-download-line" class="h-8 w-8 text-gray-400" />
          </div>
          <h3 class="mb-2 text-lg font-semibold">No resources yet</h3>
          <p class="mb-2 max-w-sm text-gray-500">
            Printable forms and reference documents will appear here once an admin uploads them.
          </p>
          <UButton v-if="canManage" to="/admin/resources" icon="i-ri-upload-2-line"> Manage resources </UButton>
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UCard v-for="resource in resources" :key="resource.id">
            <div class="flex items-start gap-3">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <UIcon :name="iconFor(resource.mimeType)" class="h-6 w-6 text-primary" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="truncate font-semibold">{{ resource.title }}</h3>
                <p v-if="resource.description" class="mt-1 line-clamp-2 text-sm text-muted">
                  {{ resource.description }}
                </p>
                <p class="mt-2 text-xs text-muted">{{ resource.fileName }} · {{ formatBytes(resource.fileSize) }}</p>
              </div>
            </div>
            <template #footer>
              <UButton
                :to="`/api/resources/${resource.id}/download`"
                external
                download
                block
                icon="i-ri-download-line"
                color="primary"
                variant="soft"
              >
                Download
              </UButton>
            </template>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
