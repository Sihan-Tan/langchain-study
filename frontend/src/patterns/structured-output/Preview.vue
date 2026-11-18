<script setup lang="ts">
import { computed, ref } from "vue";
import { render as katexRender } from "katex";
import { useStream } from "@langchain/vue";
import { HumanMessage, AIMessage } from "langchain";
import type { agent as structuredOutputAgent, MathSolution } from "../../../../agents/structured-output.ts";

import { SLUG_TO_ASSISTANT } from "@/constants";
import {
  ChatContainer,
  HumanBubble,
  ChatInput,
  TypingIndicator,
  PresetPrompts,
} from "@/components/playground";

const PRESETS = [
  "Solve the quadratic equation: 2x² + 5x - 3 = 0",
  "Find the derivative of f(x) = x³ · sin(x)",
];

const threadId = ref<string | null>(null);
const stream = useStream<typeof structuredOutputAgent>({
  assistantId: SLUG_TO_ASSISTANT["structured-output"],
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

const lastAIMessage = computed(() => stream.messages.value.find(AIMessage.isInstance));
const solution = computed(
  () => lastAIMessage.value?.tool_calls?.[0]?.args as MathSolution | undefined,
);
const humanMessages = computed(() =>
  stream.messages.value.filter((m) => HumanMessage.isInstance(m)),
);

const showInput = computed(() => stream.messages.value.length === 0);
</script>

<template>
  <ChatContainer>
    <PresetPrompts
      v-if="stream.messages.value.length === 0"
      :prompts="PRESETS"
      @select="handleSubmit"
    />

    <HumanBubble v-for="(msg, i) in humanMessages" :key="msg.id ?? i">{{ msg.text }}</HumanBubble>

    <!-- Solution Card -->
    <div v-if="solution" class="rounded-lg border border-border bg-surface-secondary p-4 space-y-3">
      <div v-if="solution.problem" class="text-sm font-medium text-text">
        {{ solution.problem }}
      </div>
      <ol v-if="(solution.steps ?? []).length > 0" class="space-y-3 list-decimal list-inside">
        <li v-for="(step, i) in solution.steps" :key="i" class="text-sm text-text-secondary">
          <span v-if="step.explanation">{{ step.explanation }}</span>
          <LatexBlock v-if="step.latex" :latex="step.latex" />
        </li>
      </ol>
      <div
        v-if="solution.finalAnswer || solution.finalAnswerLatex"
        class="border-t border-border pt-3"
      >
        <div class="text-xs font-medium text-text-secondary mb-1">Final Answer</div>
        <div v-if="solution.finalAnswer" class="text-sm font-medium text-primary">
          {{ solution.finalAnswer }}
        </div>
        <LatexBlock v-if="solution.finalAnswerLatex" :latex="solution.finalAnswerLatex" />
      </div>
    </div>

    <TypingIndicator v-if="stream.isLoading.value" />

    <template v-if="showInput" #input>
      <ChatInput
        @submit="handleSubmit"
        :disabled="stream.isLoading.value"
        :showNewThread="stream.messages.value.length > 0"
        @newThread="handleNewThread"
      />
    </template>
  </ChatContainer>
</template>

<script lang="ts">
import {
  defineComponent,
  ref as vueRef,
  onMounted as vueOnMounted,
  watch as vueWatch,
  h,
} from "vue";

const LatexBlock = defineComponent({
  name: "LatexBlock",
  props: {
    latex: { type: String, required: true },
  },
  setup(props) {
    const elRef = vueRef<HTMLDivElement>();

    function renderLatex() {
      if (!elRef.value) return;
      try {
        katexRender(props.latex, elRef.value, {
          throwOnError: false,
          displayMode: true,
        });
      } catch {
        if (elRef.value) {
          elRef.value.textContent = props.latex;
        }
      }
    }

    vueOnMounted(renderLatex);
    vueWatch(() => props.latex, renderLatex);

    return () => h("div", { ref: elRef, class: "my-2 overflow-x-auto text-center" });
  },
});

export { LatexBlock };
</script>
