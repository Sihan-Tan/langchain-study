<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import { useStream } from "@langchain/vue";
import { HumanMessage, AIMessage } from "langchain";
import type { Message } from "@langchain/core/messages";
import type { agent as joinRejoinAgent } from "@agents/join-rejoin";

import { AGENT_SERVER_URL, SLUG_TO_ASSISTANT } from "@/constants";
import {
  ChatContainer,
  HumanBubble,
  AIBubble,
  ToolCallCard,
  ChatInput,
  TypingIndicator,
  PresetPrompts,
  Markdown,
} from "@/components/playground";

const PRESETS = ["Do a thorough analysis of the differences between React, Vue, and Angular"];

const props = defineProps<{
  threadId: string | null;
}>();

const emit = defineEmits<{
  threadId: [id: string | null];
  disconnect: [messages: Message[]];
  runCreated: [runId: string];
  controlsChange: [controls: { disconnect: () => void; isLoading: boolean } | null];
}>();

const stream = useStream<typeof joinRejoinAgent>({
  apiUrl: AGENT_SERVER_URL,
  assistantId: SLUG_TO_ASSISTANT["join-rejoin"],
  threadId: () => props.threadId,
  onThreadId(id) {
    emit("threadId", id);
  },
  onCreated(run) {
    const runId = run.runId;
    emit("runCreated", runId);
  },
});

const messages = computed(() => stream.messages.value ?? []);
const hasMessages = computed(() => messages.value.length > 0);

function handleDisconnect() {
  void stream.disconnect();
  emit("disconnect", messages.value);
}

function handleSubmit(text: string) {
  stream.submit({ messages: [{ type: "human" as const, content: text }] });
}

watch(
  () => stream.isLoading.value,
  () => {
    emit("controlsChange", {
      disconnect: handleDisconnect,
      isLoading: stream.isLoading.value,
    });
  },
  { immediate: true },
);

onUnmounted(() => emit("controlsChange", null));
</script>

<template>
  <ChatContainer embedded>
    <PresetPrompts v-if="!hasMessages" :prompts="PRESETS" @select="handleSubmit" />

    <template v-for="(msg, i) in messages" :key="msg.id ?? i">
      <HumanBubble v-if="HumanMessage.isInstance(msg)">
        <Markdown :content="msg.text" />
      </HumanBubble>
      <div v-else-if="AIMessage.isInstance(msg)" class="flex flex-col gap-2">
        <AIBubble>
          <Markdown :content="msg.text" />
        </AIBubble>
        <div
          v-for="tc in stream.toolCalls.value.filter((tc) =>
            msg.tool_calls?.find((t: { id?: string }) => t.id === tc.callId),
          )"
          :key="tc.callId"
          class="pl-9 max-w-[80%]"
        >
          <ToolCallCard :tool-call="tc" />
        </div>
      </div>
    </template>

    <TypingIndicator v-if="stream.isLoading.value" />

    <template #input>
      <ChatInput
        @submit="handleSubmit"
        :disabled="stream.isLoading.value"
        :showNewThread="hasMessages"
        @newThread="emit('threadId', null)"
      />
    </template>
  </ChatContainer>
</template>
