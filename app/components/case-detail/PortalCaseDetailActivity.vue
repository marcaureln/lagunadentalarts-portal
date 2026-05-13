<script setup lang="ts">
import { formatDateTime as formatDate } from '~~/shared/utils/format';
import { CASE_STATUS_META } from '~~/shared/utils/caseStatus';
import type { CaseStatusName } from '~~/shared/utils/permissions';

interface CaseEvent {
  id: string;
  type: string;
  fromStatus?: string;
  toStatus?: string;
  message?: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
}

defineProps<{
  events: CaseEvent[];
}>();

const eventTypeLabels: Record<string, string> = {
  CREATED: 'Case created',
  SUBMITTED: 'Case submitted',
  STATUS_CHANGED: 'Status changed',
  UPDATED: 'Case updated',
  FILE_UPLOADED: 'File uploaded',
  FILE_DOWNLOADED: 'File downloaded',
  COMMENT_ADDED: 'Comment added',
  ASSIGNED: 'Case assigned',
  UNASSIGNED: 'Case unassigned',
};

const eventIcon = (type: string): string => {
  switch (type) {
    case 'CREATED':
      return 'i-ri-add-line';
    case 'SUBMITTED':
      return 'i-ri-send-plane-line';
    case 'STATUS_CHANGED':
      return 'i-ri-refresh-line';
    case 'FILE_UPLOADED':
      return 'i-ri-upload-line';
    case 'FILE_DOWNLOADED':
      return 'i-ri-download-line';
    case 'ASSIGNED':
    case 'UNASSIGNED':
      return 'i-ri-user-line';
    default:
      return 'i-ri-edit-line';
  }
};
</script>

<template>
  <UCollapsible class="overflow-hidden rounded-lg border border-default">
    <template #default="{ open: expanded }">
      <button type="button" class="flex w-full items-center justify-between gap-2 bg-elevated/50 px-4 py-3 text-left">
        <h3 class="font-semibold">Activity</h3>
        <UIcon :name="expanded ? 'i-ri-arrow-up-s-line' : 'i-ri-arrow-down-s-line'" class="h-5 w-5 text-muted" />
      </button>
    </template>
    <template #content>
      <div class="space-y-4 px-4 py-4">
        <div v-for="event in events" :key="event.id" class="flex gap-3">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <UIcon :name="eventIcon(event.type)" class="h-4 w-4 text-muted" />
          </div>
          <div class="flex-1">
            <p class="space-x-1 text-sm">
              <span class="font-medium">{{ event.createdBy.name }}</span>
              <span class="text-muted"> {{ eventTypeLabels[event.type] || event.type }}</span>
              <span v-if="event.type === 'STATUS_CHANGED' && event.fromStatus && event.toStatus" class="text-muted">
                · {{ CASE_STATUS_META[event.fromStatus as CaseStatusName].label }} →
                {{ CASE_STATUS_META[event.toStatus as CaseStatusName].label }}
              </span>
              <span v-else-if="event.type === 'ASSIGNED' && event.message" class="text-muted">
                · {{ event.message }}
              </span>
            </p>
            <p v-if="event.message && event.type !== 'ASSIGNED'" class="mt-1 text-sm text-muted">
              {{ event.message }}
            </p>
            <p class="mt-1 text-xs text-muted">{{ formatDate(event.createdAt) }}</p>
          </div>
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
