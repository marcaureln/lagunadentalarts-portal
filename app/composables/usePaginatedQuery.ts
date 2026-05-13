import type { Ref } from 'vue';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UsePaginatedQueryOptions {
  pageSize?: number;
  initialPage?: number;
  key?: string;
}

export interface UsePaginatedQueryResult<T> {
  items: Ref<T[]>;
  total: Ref<number>;
  page: Ref<number>;
  pageSize: number;
  isLoading: Ref<boolean>;
  error: Ref<unknown>;
  refresh: () => Promise<void>;
}

export function usePaginatedQuery<T>(
  url: string,
  filters: () => Record<string, unknown>,
  options: UsePaginatedQueryOptions = {}
): UsePaginatedQueryResult<T> {
  const pageSize = options.pageSize ?? 25;
  const page = ref(options.initialPage ?? 1);

  const query = computed(() => ({
    ...filters(),
    page: page.value,
    pageSize,
  }));

  const { data, status, error, refresh } = useFetch<PaginatedResponse<T>>(url, {
    query,
    lazy: true,
    default: () => ({ items: [], total: 0, page: 1, pageSize }),
    key: options.key,
  });

  const items = computed<T[]>(() => data.value?.items ?? []);
  const total = computed(() => data.value?.total ?? 0);
  const isLoading = computed(() => status.value === 'pending');

  return {
    items,
    total,
    page,
    pageSize,
    isLoading,
    error: error as Ref<unknown>,
    refresh: () => refresh(),
  };
}
