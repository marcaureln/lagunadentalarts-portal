<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });

defineProps<{
  busy: boolean;
}>();

const emit = defineEmits<{
  submit: [message: string];
}>();

const message = ref('');

watch(open, (val) => {
  if (val) message.value = '';
});

const onSend = () => {
  const trimmed = message.value.trim();
  if (!trimmed) return;
  emit('submit', trimmed);
};
</script>

<template>
  <UModal v-model:open="open" title="Request more information" :ui="{ content: 'sm:max-w-lg' }">
    <template #body>
      <div class="space-y-3">
        <p class="text-sm text-muted">
          Describe what the practice needs to clarify or add. They will see this message and be able to edit the case.
        </p>
        <UTextarea
          v-model="message"
          :rows="5"
          autofocus
          placeholder="e.g. The bite registration is missing, please upload before we proceed."
          class="w-full"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" :disabled="busy" @click="open = false">Cancel</UButton>
        <UButton
          color="warning"
          icon="i-ri-send-plane-line"
          :disabled="!message.trim() || busy"
          :loading="busy"
          @click="onSend"
        >
          Send request
        </UButton>
      </div>
    </template>
  </UModal>
</template>
