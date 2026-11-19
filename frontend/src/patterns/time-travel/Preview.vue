<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { AIMessage, HumanMessage, type BaseMessage } from "langchain";
import { useStream } from "@langchain/vue";
import type { Checkpoint, ThreadState } from "@langchain/langgraph-sdk";
import type { agent as timeTravelAgent } from "@agents/time-travel";

import { historyToMessages } from "./utils";
import { SLUG_TO_ASSISTANT } from "@/constants";
import {
  ChatContainer,
  AIBubble,
  HumanBubble,
  ChatInput,
  TypingIndicator,
  PresetPrompts,
  SplitView,
  Markdown,
  ToolCallCard,
} from "@/components/playground";

const PRESETS = ["What's the weather in Paris? Then convert the temperature to Fahrenheit."];

interface AgentState {
  messages: BaseMessage[];
}

const threadId = ref<string | null>(
  new URLSearchParams(window.location.search).get("threadId") ?? null,
);

function onThreadId(newId: string) {
  threadId.value = newId;
  const url = new URL(window.location.href);
  url.searchParams.set("threadId", newId);
  window.history.replaceState({}, "", url.toString());
}

function handleNewThread() {
  threadId.value = null;
  const url = new URL(window.location.href);
  url.searchParams.delete("threadId");
  window.history.replaceState({}, "", url.toString());
}

const stream = useStream<typeof timeTravelAgent>({
  assistantId: SLUG_TO_ASSISTANT["time-travel"],
  threadId,
  onThreadId,
});

const selectedCheckpoint = ref<ThreadState | null>(null);
const history = ref<ThreadState[]>([]);

// v1 useStream no longer exposes `history`; fetch it via the LGP client.
async function refreshHistory() {
  if (!threadId.value || !stream.client) {
    history.value = [];
    return;
  }
  try {
    history.value = (await stream.client.threads.getHistory(threadId.value)) as ThreadState[];
  } catch {
    history.value = [];
  }
}

watch([threadId, () => stream.isLoading.value], () => {
  void refreshHistory();
});

function handleSubmit(text: string) {
  selectedCheckpoint.value = null;
  stream.submit({ messages: [{ type: "human" as const, content: text }] });
}

function handleResume(checkpoint: Omit<Checkpoint, "thread_id"> | undefined) {
  if (!checkpoint?.checkpoint_id) return;
  selectedCheckpoint.value = null;
  stream.submit(undefined, { forkFrom: checkpoint.checkpoint_id });
}

const isViewingHistory = computed(() => selectedCheckpoint.value !== null);
const displayMessages = computed((): BaseMessage[] => {
  const historyMessages = (selectedCheckpoint.value?.values as AgentState | undefined)?.messages;
  return isViewingHistory.value
    ? historyToMessages(historyMessages)
    : (stream.messages.value ?? []);
});
const hasMessages = computed(() => (stream.messages.value ?? []).length > 0);
</script>

<template>
  <SplitView>
    <template #main>
      <ChatContainer>
        <PresetPrompts
          v-if="!hasMessages && !isViewingHistory"
          :prompts="PRESETS"
          @select="handleSubmit"
        />

        <div
          v-if="isViewingHistory"
          class="flex items-center gap-2 mx-auto mb-4 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/30 text-xs text-warning"
        >
          <span>
            Viewing checkpoint:
            {{ selectedCheckpoint?.tasks?.[0]?.name ?? "checkpoint" }}
          </span>
          <button
            type="button"
            @click="selectedCheckpoint = null"
            class="underline hover:no-underline cursor-pointer"
          >
            Back to latest
          </button>
        </div>

        <template v-for="(msg, i) in displayMessages" :key="msg.id ?? i">
          <HumanBubble v-if="HumanMessage.isInstance(msg)">
            <Markdown :content="msg.text" />
          </HumanBubble>

          <div v-else-if="AIMessage.isInstance(msg)">
            <AIBubble>
              <Markdown :content="msg.text" />
            </AIBubble>
            <div
              v-if="!isViewingHistory"
              v-for="tc in stream.toolCalls.value.filter((tc) =>
                msg.tool_calls?.find((t: { id?: string }) => t.id === tc.callId),
              )"
              :key="tc.callId"
              class="pl-9 mt-4 max-w-[80%]"
            >
              <ToolCallCard :tool-call="tc" />
            </div>
          </div>
        </template>

        <TypingIndicator v-if="stream.isLoading.value && !isViewingHistory" />

        <template #input>
          <ChatInput
            @submit="handleSubmit"
            :disabled="stream.isLoading.value"
            :showNewThread="hasMessages"
            @newThread="handleNewThread"
          />
        </template>
      </ChatContainer>
    </template>

    <template #sidebar>
      <div class="p-3 space-y-2">
        <div class="text-xs font-medium text-text-secondary mb-2">Checkpoint Timeline</div>
        <div v-if="history.length === 0" class="text-xs text-text-tertiary">
          Send a message to see checkpoints
        </div>
        <button
          v-for="(cp, i) in history"
          :key="cp.checkpoint?.checkpoint_id ?? i"
          type="button"
          @click="selectedCheckpoint = cp"
          :class="[
            'w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors cursor-pointer',
            selectedCheckpoint?.checkpoint?.checkpoint_id === cp.checkpoint?.checkpoint_id
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-border-hover',
          ]"
        >
          <div class="font-medium text-text">{{ cp.tasks?.[0]?.name ?? "checkpoint" }}</div>
          <div class="text-text-tertiary mt-0.5">
            Messages:
            {{ (cp.values as { messages?: unknown[] } | undefined)?.messages?.length ?? 0 }}
          </div>
        </button>
        <div v-if="selectedCheckpoint" class="space-y-2 pt-2 border-t border-border">
          <button
            type="button"
            @click="handleResume(selectedCheckpoint!.checkpoint)"
            class="w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 cursor-pointer"
          >
            Resume from here
          </button>
        </div>
      </div>
    </template>
  </SplitView>
</template>
