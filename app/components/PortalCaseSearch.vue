<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
import { CASE_STATUS_META } from '~~/shared/utils/caseStatus';

interface SearchResult {
  id: string;
  patientName: string;
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_INFO' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  practice: { id: string; name: string };
  caseType: { id: string; key: string; label: string };
}

const router = useRouter();
const searchInputRef = useTemplateRef('searchInput');
const searchQuery = ref('');
const debouncedQuery = ref('');
const results = ref<SearchResult[]>([]);
const isSearching = ref(false);
const isPopoverOpen = ref(false);

defineShortcuts({
  '/': () => {
    searchInputRef.value?.inputRef?.focus();
  },
});

const debouncedUpdate = useDebounceFn((q: string) => {
  debouncedQuery.value = q;
}, 300);

watch(searchQuery, (q) => {
  debouncedUpdate(q);
});

watch(debouncedQuery, async (q) => {
  const trimmed = q.trim();
  if (!trimmed) {
    results.value = [];
    isPopoverOpen.value = false;
    return;
  }
  isSearching.value = true;
  try {
    const data = await $fetch<SearchResult[]>('/api/cases/search', { query: { q: trimmed } });
    results.value = data;
    isPopoverOpen.value = true;
  } catch {
    results.value = [];
    isPopoverOpen.value = false;
  } finally {
    isSearching.value = false;
  }
});

function onFocus() {
  if (debouncedQuery.value.trim()) {
    isPopoverOpen.value = true;
  }
}

function onPopoverOpenChange(open: boolean) {
  if (!open) {
    isPopoverOpen.value = false;
  }
}

function clearSearch() {
  searchQuery.value = '';
  results.value = [];
  isPopoverOpen.value = false;
}

const route = useRoute();

function selectResult(item: SearchResult) {
  isPopoverOpen.value = false;
  searchQuery.value = '';
  results.value = [];
  if (route.path === '/cases') {
    router.replace({ query: { ...route.query, caseId: item.id } });
  } else {
    router.push({ path: '/cases', query: { caseId: item.id } });
  }
}

function onInputKeydown(e: KeyboardEvent) {
  if (!isPopoverOpen.value || results.value.length === 0) return;

  if (e.key === 'Escape') {
    isPopoverOpen.value = false;
  } else if (e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault();
    const first = document.querySelector<HTMLButtonElement>('[data-search-result]');
    first?.focus();
  }
}

function onResultKeydown(e: KeyboardEvent, index: number) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = document.querySelector<HTMLButtonElement>(`[data-search-result="${index + 1}"]`);
    next?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (index === 0) {
      searchInputRef.value?.inputRef?.focus();
    } else {
      const prev = document.querySelector<HTMLButtonElement>(`[data-search-result="${index - 1}"]`);
      prev?.focus();
    }
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const item = results.value[index];
    if (item) selectResult(item);
  } else if (e.key === 'Escape') {
    isPopoverOpen.value = false;
    searchInputRef.value?.inputRef?.focus();
  }
}
</script>

<template>
  <UPopover :open="isPopoverOpen" @update:open="onPopoverOpenChange">
    <div>
      <UInput
        ref="searchInput"
        v-model="searchQuery"
        placeholder="Search cases..."
        size="lg"
        leading-icon="i-ri-search-line"
        trailing
        class="w-[32rem] lg:w-[40rem]"
        @focus="onFocus"
        @keydown="onInputKeydown"
      >
        <template #trailing>
          <template v-if="isSearching">
            <UIcon name="i-ri-loader-4-line" class="h-4 w-4 animate-spin text-muted" />
          </template>
          <template v-else-if="searchQuery">
            <UButton
              icon="i-ri-close-line"
              variant="ghost"
              size="xs"
              color="neutral"
              class="-my-1"
              @click.stop="clearSearch"
            />
          </template>
          <template v-else>
            <UKbd value="/" />
          </template>
        </template>
      </UInput>
    </div>

    <template #content>
      <div class="max-h-80 w-[32rem] overflow-auto p-1 lg:w-[40rem]">
        <div v-if="isSearching" class="flex items-center justify-center gap-2 py-6 text-sm text-muted">
          <UIcon name="i-ri-loader-4-line" class="h-4 w-4 animate-spin" />
          Searching...
        </div>

        <div v-else-if="results.length === 0" class="py-6 text-center text-sm text-muted">No cases found</div>

        <div v-else class="flex flex-col gap-0.5" role="listbox">
          <button
            v-for="(item, index) in results"
            :key="item.id"
            :data-search-result="index"
            class="flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accented focus:bg-accented focus:outline-none"
            role="option"
            @click="selectResult(item)"
            @keydown="onResultKeydown($event, index)"
          >
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">{{ item.patientName }}</div>
              <div class="flex items-center gap-2 text-xs text-muted">
                <span class="truncate">{{ item.caseType.label }}</span>
                <span>&middot;</span>
                <span class="truncate">{{ item.practice.name }}</span>
              </div>
            </div>
            <UBadge
              :label="CASE_STATUS_META[item.status]?.label ?? item.status"
              :color="CASE_STATUS_META[item.status]?.color ?? 'neutral'"
              variant="subtle"
              size="lg"
            />
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>
