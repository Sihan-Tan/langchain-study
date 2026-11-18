<script setup lang="ts">
import { ref } from "vue";
import { useStream } from "@langchain/vue";
import { HumanMessage, AIMessage } from "langchain";
import type { agent as reasoningAgent } from "../../../../agents/reasoning-tokens";

import { SLUG_TO_ASSISTANT } from "@/constants";
import {
  ChatContainer,
  ChatInput,
  AIBubble,
  HumanBubble,
  ThinkingBubble,
  TypingIndicator,
  PresetPrompts,
  Markdown,
} from "@/components/playground";

const PRESETS = [
  "Explain why 0.1 + 0.2 !== 0.3 in JavaScript",
  "A farmer has 100 feet of fencing. What dimensions of a rectangular pen maximize the enclosed area, and what is that area?",
];

const threadId = ref<string | null>(null);
const stream = useStream<typeof reasoningAgent>({
  assistantId: SLUG_TO_ASSISTANT["reasoning-tokens"],
  threadId,
  onThreadId: (id: string) => {
    threadId.value = id;
  },
});

function handleSubmit(text: string) {
  stream.submit({ messages: [{ type: "human" as const, content: text }] });
}

function handleNewThread() {
  threadId.value = null;
}
</script>

<template>
  <ChatContainer>
    <PresetPrompts
      v-if="stream.messages.value.length === 0"
      :prompts="PRESETS"
      @select="handleSubmit"
    />

    <template v-for="(msg, i) in stream.messages.value" :key="msg.id ?? i">
      <HumanBubble v-if="HumanMessage.isInstance(msg)">
        <Markdown :content="msg.text" />
      </HumanBubble>

      <div v-else-if="AIMessage.isInstance(msg)" class="space-y-2">
        <ThinkingBubble
          v-if="
            msg.contentBlocks
              .filter((b: any) => b.type === 'reasoning')
              .map((b: any) => b.reasoning)
              .join('').length > 0
          "
          :content="
            msg.contentBlocks
              .filter((b: any) => b.type === 'reasoning')
              .map((b: any) => b.reasoning)
              .join('')
          "
          :is-streaming="stream.isLoading.value && i === stream.messages.value.length - 1"
        />
        <AIBubble v-if="msg.contentBlocks.filter((b: any) => b.type === 'text').length > 0">
          <Markdown
            :content="
              msg.contentBlocks
                .filter((b: any) => b.type === 'text')
                .map((b: any) => b.text)
                .join('')
            "
          />
        </AIBubble>
      </div>
    </template>

    <TypingIndicator v-if="stream.isLoading.value" />

    <template #input>
      <ChatInput
        @submit="handleSubmit"
        :disabled="stream.isLoading.value"
        :showNewThread="stream.messages.value.length > 0"
        @newThread="handleNewThread"
      />
    </template>
  </ChatContainer>
</template>
