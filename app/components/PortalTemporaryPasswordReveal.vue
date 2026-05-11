<script setup lang="ts">
defineProps<{ password: string | null }>();
const emit = defineEmits<{ copy: [] }>();
</script>

<template>
  <template v-if="password">
    <UAlert
      color="warning"
      variant="soft"
      title="Temporary password"
      description="Copy this password now. It will not be shown again."
      icon="i-ri-key-2-line"
    />
    <UInput :model-value="password" class="w-full" readonly :ui="{ trailing: 'pe-1' }">
      <template #trailing>
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          icon="i-ri-file-copy-line"
          aria-label="Copy temporary password"
          @click="emit('copy')"
        />
      </template>
    </UInput>
  </template>
</template>
