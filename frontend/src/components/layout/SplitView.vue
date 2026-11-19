<script setup lang="ts">
withDefaults(
  defineProps<{
    sidebarWidth?: number;
  }>(),
  { sidebarWidth: 320 },
);
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <slot name="main" />
    </div>
    <div
      class="min-h-0 overflow-y-auto border-l border-border"
      :style="{ width: `${sidebarWidth}px` }"
    >
      <slot name="sidebar" />
    </div>
  </div>
</template>
