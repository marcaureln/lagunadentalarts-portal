<script setup lang="ts">
import type { CaseStatusName } from '~~/shared/utils/permissions';

export type ActionKey = 'start-working' | 'mark-complete' | 'request-info' | 'cancel-case';

defineProps<{
  status: CaseStatusName | null;
  canRequestInfo: boolean;
  canCancel: boolean;
  canStartWorking: boolean;
  canMarkComplete: boolean;
  canResubmitNeedsInfo: boolean;
  isAnyBusy: boolean;
  busyAction: ActionKey | null;
}>();

const emit = defineEmits<{
  action: [key: ActionKey];
  requestInfo: [];
  edit: [];
  close: [];
}>();

const isBusy = (key: ActionKey, busyAction: ActionKey | null) => busyAction === key;
</script>

<template>
  <div class="flex w-full flex-wrap items-center justify-between gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <UButton
        v-if="canRequestInfo"
        size="sm"
        color="warning"
        variant="outline"
        icon="i-ri-question-line"
        :disabled="isAnyBusy"
        @click="emit('requestInfo')"
      >
        Request info
      </UButton>
      <UButton
        v-if="canCancel"
        size="sm"
        color="error"
        variant="ghost"
        icon="i-ri-close-circle-line"
        :loading="isBusy('cancel-case', busyAction)"
        :disabled="isAnyBusy && !isBusy('cancel-case', busyAction)"
        @click="emit('action', 'cancel-case')"
      >
        Cancel case
      </UButton>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UButton color="neutral" variant="outline" @click="emit('close')">Close</UButton>

      <UButton v-if="status === 'DRAFT'" color="primary" icon="i-ri-edit-line" @click="emit('edit')">
        Continue editing
      </UButton>
      <UButton v-else-if="canResubmitNeedsInfo" color="warning" icon="i-ri-edit-line" @click="emit('edit')">
        Address &amp; Resubmit
      </UButton>

      <UButton
        v-if="canStartWorking"
        color="primary"
        icon="i-ri-play-line"
        :loading="isBusy('start-working', busyAction)"
        :disabled="isAnyBusy && !isBusy('start-working', busyAction)"
        @click="emit('action', 'start-working')"
      >
        Start working
      </UButton>
      <UButton
        v-if="canMarkComplete"
        color="success"
        icon="i-ri-checkbox-circle-line"
        :loading="isBusy('mark-complete', busyAction)"
        :disabled="isAnyBusy && !isBusy('mark-complete', busyAction)"
        @click="emit('action', 'mark-complete')"
      >
        Mark complete
      </UButton>
    </div>
  </div>
</template>
