import { useClipboard } from '@vueuse/core';

export function useTemporaryPassword() {
  const temporaryPassword = ref<string | null>(null);
  const isLocked = computed(() => Boolean(temporaryPassword.value));
  const toast = useToast();
  const { copy } = useClipboard();

  const copyTemporaryPassword = async () => {
    if (!temporaryPassword.value) return;
    try {
      await copy(temporaryPassword.value);
      toast.add({ description: 'Temporary password copied to clipboard', color: 'success' });
    } catch (e) {
      console.error('Failed to copy temporary password', e);
      toast.add({ description: 'Failed to copy temporary password', color: 'error' });
    }
  };

  const reset = () => {
    temporaryPassword.value = null;
  };

  return { temporaryPassword, isLocked, copyTemporaryPassword, reset };
}
