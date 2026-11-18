<script setup lang="ts">
import { computed, ref } from "vue";

import { ChatContainer, ChatInput, TypingIndicator, PresetPrompts } from "@/components/playground";

import { provideBranchingDemo } from "./useBranchingDemo";
import MessageRow from "./MessageRow.vue";

const PRESETS = [
  "What's the best programming language and why?",
  "Explain quantum computing simply",
  "Write a haiku about coding",
];

const {
  messages,
  isLoading,
  error,
  submitPrompt,
  forkFrom,
  resetConversation,
  activeBranch,
  switchBranch,
  branches,
} = provideBranchingDemo();

const editingId = ref<string | null>(null);
const editText = ref("");

const hasMessages = computed(() => messages.value.length > 0);
const hasMultipleBranches = computed(() => branches.value.length > 1);
const activeBranchLabel = computed(() => {
  const branch = activeBranch.value;
  if (branch === "") return "main";
  if (branch.length > 20) return `${branch.slice(0, 16)}…`;
  return branch;
});

function handleSubmit(text: string) {
  submitPrompt(text);
}

function handleEdit(parentCheckpointId: string | undefined) {
  const newContent = editText.value.trim();
  if (!newContent) {
    editingId.value = null;
    return;
  }
  editingId.value = null;
  forkFrom(parentCheckpointId, newContent);
}

function handleRegenerate(parentCheckpointId: string | undefined) {
  forkFrom(parentCheckpointId);
}

function handleEditKeyDown(e: KeyboardEvent, parentCheckpointId: string | undefined) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleEdit(parentCheckpointId);
  }
  if (e.key === "Escape") {
    editingId.value = null;
  }
}
</script>

<template>
  <ChatContainer>
    <div
      v-if="hasMultipleBranches"
      class="sticky top-0 z-10 -mx-1 mb-3 px-3 py-2 rounded-lg border border-border bg-surface-secondary/90 backdrop-blur-sm"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-medium text-text-secondary">Conversation branches</span>
        <span class="text-[10px] text-text-tertiary tabular-nums">
          Viewing:
          <span class="text-text-secondary font-medium">{{ activeBranchLabel }}</span>
        </span>
      </div>
    </div>

    <PresetPrompts v-if="!hasMessages" :prompts="PRESETS" @select="handleSubmit" />

    <MessageRow
      v-for="(msg, idx) in messages"
      :key="msg.id ?? idx"
      :msg="msg"
      :idx="idx"
      :is-loading="isLoading"
      :active-branch="activeBranch"
      v-model:editing-id="editingId"
      v-model:edit-text="editText"
      @switch-branch="switchBranch"
      @edit="handleEdit"
      @regenerate="handleRegenerate"
      @edit-key-down="handleEditKeyDown"
    />

    <TypingIndicator v-if="isLoading" />

    <div
      v-if="error != null"
      class="px-3.5 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm"
    >
      <strong>Error:</strong>
      <span class="opacity-90">{{ error instanceof Error ? error.message : String(error) }}</span>
    </div>

    <template #input>
      <ChatInput
        @submit="handleSubmit"
        :disabled="isLoading"
        :showNewThread="hasMessages"
        @newThread="resetConversation"
      />
    </template>
  </ChatContainer>
</template>
