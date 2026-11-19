<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";

const ENTRIES = [
  { name: "markdown-messages", label: "Markdown" },
  { name: "tool-calling", label: "Tool Calling" },
  { name: "human-in-the-loop", label: "Human-in-the-Loop" },
  { name: "branch-chat", label: "Branch Chat" },
  { name: "reasoning-tokens", label: "Reasoning Tokens" },
  { name: "structured-output", label: "Structured Output" },
  { name: "message-queues", label: "Message Queues" },
];

const route = useRoute();
const open = ref(false);
const root = ref<HTMLElement>();

const activeLabel = computed(
  () => ENTRIES.find((entry) => entry.name === route.name)?.label ?? "Select pattern",
);

function close() {
  open.value = false;
}

function isActive(name: string): boolean {
  return route.name === name;
}

function onDocumentClick(event: MouseEvent) {
  if (!root.value?.contains(event.target as Node)) close();
}

onMounted(() => document.addEventListener("click", onDocumentClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocumentClick));
</script>

<template>
  <div class="h-full flex flex-col bg-[var(--color-surface)] text-[var(--color-text)]">
    <nav
      class="sticky top-0 z-10 flex items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/80 px-6 py-3 backdrop-blur"
    >
      <RouterLink
        to="/"
        class="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)]"
      >
        LangChain Patterns
      </RouterLink>

      <div ref="root" class="relative ml-auto text-sm">
        <button
          type="button"
          class="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          :aria-expanded="open"
          aria-haspopup="listbox"
          @click="open = !open"
        >
          <span>{{ activeLabel }}</span>
          <svg
            class="size-3.5 shrink-0 transition-transform"
            :class="open ? 'rotate-180' : ''"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        <ul
          v-if="open"
          role="listbox"
          class="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
        >
          <li v-for="entry in ENTRIES" :key="entry.name">
            <RouterLink
              :to="{ name: entry.name }"
              class="block px-3 py-2 transition-colors"
              :class="
                isActive(entry.name)
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-primary)]'
              "
              @click="close"
            >
              {{ entry.label }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <main class="min-h-0 flex-1 mx-auto max-w-5xl p-6">
      <router-view />
    </main>
  </div>
</template>
