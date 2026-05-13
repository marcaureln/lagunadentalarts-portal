<script setup lang="ts">
const props = withDefaults(defineProps<{ rows?: number; columns?: number }>(), { rows: 8, columns: 5 });

const BAR_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-3/5', 'w-2/5', 'w-4/5'];
const widthFor = (row: number, col: number) => BAR_WIDTHS[(row * 3 + col) % BAR_WIDTHS.length];
</script>

<template>
  <div class="divide-y divide-default">
    <div :style="{ gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))` }" class="grid gap-4 px-4 py-3">
      <div v-for="c in props.columns" :key="`h-${c}`" class="h-3 w-16 animate-pulse rounded bg-elevated" />
    </div>
    <div
      v-for="r in props.rows"
      :key="r"
      :style="{ gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))` }"
      class="grid items-center gap-4 px-4 py-3"
    >
      <div v-for="c in props.columns" :key="c" class="h-4 animate-pulse rounded bg-elevated" :class="widthFor(r, c)" />
    </div>
  </div>
</template>
