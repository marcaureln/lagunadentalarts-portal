<script setup lang="ts">
definePageMeta({ middleware: 'admin-only' });

const route = useRoute();
const practiceId = computed(() => route.params.id as string);

const { data: practice } = await useFetch<{ id: string; name: string }>(() => `/api/practices/${practiceId.value}`);

useSeoMeta({
  title: () => (practice.value ? `${practice.value.name} — Staff` : 'Practice Staff'),
});

const staffTableRef = useTemplateRef<{ refresh: () => Promise<void> }>('staffTable');
const onStaffAdded = () => staffTableRef.value?.refresh();
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="practice ? `${practice.name} — Staff` : 'Practice Staff'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton variant="ghost" color="neutral" icon="i-ri-arrow-left-line" to="/admin/practices">
            Back to practices
          </UButton>
          <PortalPracticeStaffFormModal :practice-id="practiceId" @success="onStaffAdded" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <PortalPracticeStaffTable ref="staffTable" :practice-id="practiceId" />
    </template>
  </UDashboardPanel>
</template>
