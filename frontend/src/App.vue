<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";

const route = useRoute();

function isActive(name: string): boolean {
  return route.name === name;
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
    <nav
      class="sticky top-0 z-10 flex items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/80 px-6 py-3 backdrop-blur"
    >
      <RouterLink
        to="/"
        class="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)]"
      >
        LangChain Patterns
      </RouterLink>
      <div class="ml-auto flex items-center gap-2 text-sm">
        <RouterLink
          v-for="entry in [
            { name: 'markdown-messages', label: 'Markdown' },
            { name: 'tool-calling', label: 'Tool Calling' },
            { name: 'human-in-the-loop', label: 'Human-in-the-Loop' },
          ]"
          :key="entry.name"
          :to="{ name: entry.name }"
          class="rounded-md px-3 py-1.5 transition-colors"
          :class="
            isActive(entry.name)
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
          "
        >
          {{ entry.label }}
        </RouterLink>
      </div>
    </nav>

    <main class="mx-auto max-w-5xl p-6">
      <router-view />
    </main>
  </div>
</template>
