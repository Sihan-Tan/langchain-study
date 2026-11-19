<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useStream, useSubmissionQueue } from "@langchain/vue";
import { AIMessage, HumanMessage } from "langchain";
import type { agent as messageQueuesAgent } from "../../../../agents/message-queues";

import { SLUG_TO_ASSISTANT } from "@/constants";
import {
  ChatContainer,
  AIBubble,
  HumanBubble,
  ChatInput,
  TypingIndicator,
  PresetPrompts,
  Markdown,
} from "@/components/playground";

const PRESETS = ["What is React?", "What is Vue?", "What is Svelte?"];

const pendingFollowUps = ref<string[]>([]);

const threadId = ref<string | null>(null);
const stream = useStream<typeof messageQueuesAgent>({
  assistantId: SLUG_TO_ASSISTANT["message-queues"],
  threadId,
  onThreadId: (id: string) => {
    threadId.value = id;
  },
  onCreated: () => {
    flushPendingFollowUps();
  },
});

const queue = useSubmissionQueue(stream);

const messages = computed(() => stream.messages.value);
const hasMessages = computed(() => messages.value.length > 0);

function handleSubmit(text: string) {
  stream.submit({ messages: [{ type: "human" as const, content: text }] });
}

function flushPendingFollowUps() {
  const followUps = pendingFollowUps.value;
  if (followUps.length === 0) return;
  pendingFollowUps.value = [];
  for (const text of followUps) {
    stream.submit(
      { messages: [{ type: "human" as const, content: text }] },
      { multitaskStrategy: "enqueue" },
    );
  }
}

watch(
  () => stream.isLoading.value,
  (loading) => {
    if (loading) flushPendingFollowUps();
  },
);

function handlePresetClick(selected: string) {
  pendingFollowUps.value = PRESETS.filter((prompt) => prompt !== selected);
  handleSubmit(selected);
}

function handleNewThread() {
  threadId.value = null;
}
</script>

<template>
  <ChatContainer>
    <PresetPrompts v-if="!hasMessages" :prompts="PRESETS" @select="handlePresetClick" />

    <template v-for="(msg, i) in messages" :key="msg.id ?? i">
      <HumanBubble v-if="HumanMessage.isInstance(msg)">
        <Markdown :content="msg.text" />
      </HumanBubble>
      <AIBubble v-else-if="AIMessage.isInstance(msg)">
        <Markdown :content="msg.text" />
      </AIBubble>
    </template>

    <TypingIndicator v-if="stream.isLoading.value" />

    <!-- Queue list -->
    <div v-if="queue.size.value > 0" class="flex justify-end">
      <div class="rounded-lg border border-border bg-surface-secondary px-3 py-2 space-y-1.5">
        <div class="text-xs font-medium text-text-secondary">
          {{ queue.size.value }} queued on server
        </div>
        <div
          v-for="entry in queue.entries.value"
          :key="entry.id"
          class="flex items-center gap-2 text-xs text-text-tertiary"
        >
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span class="max-w-[180px] truncate">
            {{
              entry.values && "messages" in entry.values && Array.isArray(entry.values.messages)
                ? (entry.values.messages.at(-1)?.content ?? "Pending…")
                : "Pending…"
            }}
          </span>
          <button
            type="button"
            @click="queue.cancel(entry.id)"
            class="ml-auto text-text-tertiary hover:text-red-400 transition-colors cursor-pointer"
            title="Cancel this queued message"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <template #input>
      <div class="space-y-2">
        <ChatInput
          @submit="handleSubmit"
          :showNewThread="hasMessages"
          @newThread="handleNewThread"
        />
        <button
          v-if="queue.size.value > 0"
          type="button"
          @click="queue.clear()"
          class="rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs text-text-secondary hover:border-red-400 hover:text-red-400 transition-colors cursor-pointer"
        >
          ✕ Clear queue ({{ queue.size.value }})
        </button>
      </div>
    </template>
  </ChatContainer>
</template>
