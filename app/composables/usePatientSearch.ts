import { useDebounceFn } from '@vueuse/core';

interface Patient {
  id: string;
  name: string;
  externalId: string | null;
}

export function usePatientSearch() {
  const term = ref('');
  const results = ref<Patient[]>([]);

  const search = useDebounceFn(async (query: string) => {
    if (!query || query.length < 2) {
      results.value = [];
      return;
    }
    try {
      results.value = await $fetch<Patient[]>('/api/patients', { query: { search: query } });
    } catch (e) {
      console.error('Failed to search patients:', e);
      results.value = [];
    }
  }, 300);

  const options = computed(() =>
    results.value.map((p) => ({
      value: p.id,
      label: p.name + (p.externalId ? ` (${p.externalId})` : ''),
    }))
  );

  return { term, results, search, options };
}
