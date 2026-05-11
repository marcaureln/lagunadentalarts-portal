import { getErrorMessage } from '~~/app/utils/errors';
import type { FetchOptions } from 'ofetch';

type MutationMethod = 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface MutateOptions {
  successMessage?: string;
  errorMessage?: string;
  silent?: boolean;
}

export function useApiMutation<TResult = unknown>(defaultErrorMsg = 'Request failed') {
  const toast = useToast();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const mutate = async (
    url: string,
    options: FetchOptions & { method: MutationMethod },
    opts: MutateOptions = {}
  ): Promise<TResult | null> => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = (await $fetch(url, options)) as TResult;
      if (opts.successMessage) {
        toast.add({ description: opts.successMessage, color: 'success' });
      }
      return result;
    } catch (e) {
      error.value = getErrorMessage(e, opts.errorMessage ?? defaultErrorMsg);
      if (!opts.silent) {
        toast.add({ description: error.value, color: 'error' });
      }
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  return { mutate, isLoading, error };
}
