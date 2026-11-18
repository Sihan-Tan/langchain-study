<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  siblingBranches: string[];
  currentBranch: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  switch: [branch: string];
}>();

const resolvedBranch = computed(() => {
  if (props.currentBranch && props.siblingBranches.includes(props.currentBranch)) {
    return props.currentBranch;
  }
  return props.siblingBranches[0]!;
});

const index = computed(() => props.siblingBranches.indexOf(resolvedBranch.value));

function goTo(delta: number) {
  const nextIndex =
    (index.value + delta + props.siblingBranches.length) % props.siblingBranches.length;
  emit("switch", props.siblingBranches[nextIndex]!);
}
</script>

<template>
  <div
    v-if="siblingBranches.length > 1"
    class="flex items-center gap-0.5 rounded-md border border-border bg-surface-secondary px-1 py-0.5"
  >
    <button
      type="button"
      :disabled="disabled"
      class="p-0.5 rounded text-text-tertiary hover:text-text hover:bg-surface-tertiary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      aria-label="Previous branch"
      @click="goTo(-1)"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
    <span class="px-1 text-[10px] font-medium text-text-secondary tabular-nums whitespace-nowrap">
      Branch {{ index + 1 }}/{{ siblingBranches.length }}
    </span>
    <button
      type="button"
      :disabled="disabled"
      class="p-0.5 rounded text-text-tertiary hover:text-text hover:bg-surface-tertiary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      aria-label="Next branch"
      @click="goTo(1)"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  </div>
</template>
