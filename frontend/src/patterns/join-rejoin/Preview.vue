<script setup lang="ts">
import { ref } from "vue";
import { HumanMessage, AIMessage } from "langchain";
import type { Message } from "@langchain/core/messages";

import { ChatContainer, HumanBubble, AIBubble, Markdown } from "@/components/playground";
import JoinRejoinChat from "./JoinRejoinChat.vue";

const JOIN_REJOIN_THREAD_STORAGE_KEY = "join-rejoin-thread-id";

const connected = ref(true);
const savedRunId = ref<string | null>(null);
const mountKey = ref(0);
const frozenMessages = ref<Message[]>([]);
const streamControls = ref<{ disconnect: () => void; isLoading: boolean } | null>(null);
const threadId = ref<string | null>(
  typeof sessionStorage !== "undefined"
    ? sessionStorage.getItem(JOIN_REJOIN_THREAD_STORAGE_KEY)
    : null,
);

function onThreadId(id: string | null) {
  threadId.value = id;
  if (typeof sessionStorage === "undefined") return;
  if (id) {
    sessionStorage.setItem(JOIN_REJOIN_THREAD_STORAGE_KEY, id);
  } else {
    sessionStorage.removeItem(JOIN_REJOIN_THREAD_STORAGE_KEY);
    savedRunId.value = null;
    frozenMessages.value = [];
  }
}

function handleDisconnect(messages: Message[]) {
  frozenMessages.value = messages;
  connected.value = false;
}

function handleRejoin() {
  mountKey.value += 1;
  connected.value = true;
}
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <div
      class="flex shrink-0 items-center justify-between border-b border-border bg-surface-secondary px-4 py-2"
    >
      <div class="flex items-center gap-2">
        <span :class="['w-2 h-2 rounded-full', connected ? 'bg-success' : 'bg-error']" />
        <span class="text-xs text-text-secondary">{{
          connected ? "Connected" : "Disconnected"
        }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="savedRunId" class="text-xs font-mono text-text-tertiary">
          Run: {{ savedRunId.slice(0, 8) }}...
        </span>
        <button
          v-if="!connected && threadId"
          type="button"
          @click="handleRejoin"
          class="rounded border border-success/30 px-2 py-1 text-xs text-success hover:bg-success/10 transition-colors"
        >
          Rejoin
        </button>
        <button
          v-if="connected && streamControls?.isLoading"
          type="button"
          @click="streamControls?.disconnect()"
          class="rounded border border-error/30 px-2 py-1 text-xs text-error hover:bg-error/10 transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 flex-col">
      <JoinRejoinChat
        v-if="connected"
        :key="mountKey"
        :thread-id="threadId"
        @thread-id="onThreadId"
        @disconnect="handleDisconnect"
        @run-created="savedRunId = $event"
        @controls-change="streamControls = $event"
      />

      <ChatContainer v-else embedded>
        <div
          v-if="frozenMessages.length === 0"
          class="flex flex-1 items-center justify-center p-8 text-sm text-text-secondary"
        >
          Disconnected from stream
        </div>
        <template v-else>
          <template v-for="(msg, i) in frozenMessages" :key="msg.id ?? i">
            <HumanBubble v-if="HumanMessage.isInstance(msg)">
              <Markdown :content="msg.text" />
            </HumanBubble>
            <AIBubble v-else-if="AIMessage.isInstance(msg)">
              <Markdown :content="msg.text" />
            </AIBubble>
          </template>
        </template>
        <div class="text-center text-xs text-warning py-2">
          Stream disconnected — agent may still be running
        </div>
      </ChatContainer>
    </div>
  </div>
</template>
