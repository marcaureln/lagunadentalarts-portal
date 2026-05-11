<script setup lang="ts">
interface LabUser {
  id: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

const props = defineProps<{
  assignedTo: { id: string; name: string } | null;
  labUsers: LabUser[];
  canSelfAssignNow: boolean;
  canManagerAssign: boolean;
  isLabInactionable: boolean;
  busy: boolean;
  anyBusy: boolean;
}>();

const emit = defineEmits<{
  assignToMe: [];
  assign: [userId: string | null];
}>();

const dropdownItems = computed(() => {
  const groups: Array<Array<{ label: string; icon?: string; onSelect: () => void }>> = [];
  const userItems = props.labUsers.map((labUser) => ({
    label: labUser.name + (labUser.id === props.assignedTo?.id ? ' (current)' : ''),
    icon: labUser.id === props.assignedTo?.id ? 'i-ri-check-line' : undefined,
    onSelect: () => emit('assign', labUser.id),
  }));
  if (userItems.length > 0) groups.push(userItems);
  if (props.assignedTo) {
    groups.push([{ label: 'Unassign', icon: 'i-ri-user-unfollow-line', onSelect: () => emit('assign', null) }]);
  }
  return groups;
});
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-default bg-elevated/50 px-4 py-3"
  >
    <div class="flex items-center gap-2 text-sm">
      <UIcon name="i-ri-user-line" class="h-4 w-4 text-muted" />
      <span class="text-muted">Assigned to:</span>
      <span v-if="assignedTo" class="font-medium">{{ assignedTo.name }}</span>
      <span v-else class="text-muted italic">Unassigned</span>
    </div>

    <div v-if="!isLabInactionable" class="flex items-center gap-2">
      <UButton
        v-if="canSelfAssignNow"
        size="sm"
        color="primary"
        icon="i-ri-user-add-line"
        :loading="busy"
        :disabled="anyBusy && !busy"
        @click="emit('assignToMe')"
      >
        Assign to me
      </UButton>

      <UDropdownMenu v-if="canManagerAssign" :items="dropdownItems">
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-ri-user-shared-line"
          :loading="busy"
          :disabled="anyBusy && !busy"
        >
          {{ assignedTo ? 'Reassign' : 'Assign…' }}
        </UButton>
      </UDropdownMenu>
    </div>
  </div>
</template>
