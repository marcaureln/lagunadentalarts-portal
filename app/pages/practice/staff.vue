<script setup lang="ts">
import { permissions } from '~~/shared/utils/permissions';

definePageMeta({
  middleware: async () => {
    const { user } = useUserSession();
    if (!permissions.canManagePracticeUsers(user.value?.role) || !user.value?.practiceId) {
      return navigateTo('/');
    }
  },
});

useSeoMeta({ title: 'Staff' });

const { user } = useUserSession();
const practiceId = computed(() => user.value?.practiceId as string);

const staffTableRef = useTemplateRef<{ refresh: () => Promise<void> }>('staffTable');
const onStaffAdded = () => staffTableRef.value?.refresh();
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-semibold">Staff</h1>
          <PortalPracticeStaffFormModal v-if="practiceId" :practice-id="practiceId" @success="onStaffAdded" />
        </div>
        <PortalPracticeStaffTable v-if="practiceId" ref="staffTable" :practice-id="practiceId" /></div
    ></template>
  </UDashboardPanel>
</template>
