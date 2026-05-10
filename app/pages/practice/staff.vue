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
    <template #header>
      <UDashboardNavbar title="Staff">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <PortalPracticeStaffModalAdd v-if="practiceId" :practice-id="practiceId" @success="onStaffAdded" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <PortalPracticeStaffTable v-if="practiceId" ref="staffTable" :practice-id="practiceId" />
    </template>
  </UDashboardPanel>
</template>
