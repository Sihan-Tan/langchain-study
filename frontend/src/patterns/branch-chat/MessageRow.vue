<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from "vue";
import type { BaseMessage } from "langchain";

import { HumanBubble, AIBubble } from "@/components/playground";

import { useBranchingMessageMetadata } from "./useBranchingDemo";
import BranchSwitcher from "./BranchSwitcher.vue";

const props = defineProps<{
  msg: BaseMessage;
  idx: number;
  isLoading: boolean;
  activeBranch: string;
  editingId: string | null;
  editText: string;
}>();

const emit = defineEmits<{
  "update:editingId": [id: string | null];
  "update:editText": [text: string];
  edit: [parentCheckpointId: string | undefined];
  regenerate: [parentCheckpointId: string | undefined];
  switchBranch: [branch: string];
  editKeyDown: [e: KeyboardEvent, parentCheckpointId: string | undefined];
}>();

const metadata = useBranchingMessageMetadata(toRef(() => props.msg.id));
const parentCheckpointId = computed(() => metadata.value?.parentCheckpointId);
const siblingBranches = computed(() => metadata.value?.siblingBranches);
const isHuman = computed(() => props.msg.type === "human");
const isEditing = computed(() => props.editingId === props.msg.id);
const hasFork = computed(
  () => siblingBranches.value !== undefined && siblingBranches.value.length > 1,
);

const editRef = ref<HTMLTextAreaElement | null>(null);

watch(isEditing, async (editing) => {
  if (editing) {
    await nextTick();
    editRef.value?.focus();
    editRef.value?.select();
  }
});
</script>

<template>
  <div>
    <div v-if="hasFork" class="flex justify-center my-2">
      <BranchSwitcher
        :sibling-branches="siblingBranches!"
        :current-branch="metadata?.branch ?? activeBranch"
        :disabled="isLoading"
        @switch="emit('switchBranch', $event)"
      />
    </div>

    <div v-if="isHuman && isEditing" class="flex justify-end items-end gap-2">
      <div class="max-w-[80%] flex flex-col gap-1.5">
        <textarea
          ref="editRef"
          :value="editText"
          rows="2"
          class="px-4 py-3 rounded-xl rounded-br-sm bg-surface-tertiary border border-primary text-text text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          @input="emit('update:editText', ($event.target as HTMLTextAreaElement).value)"
          @keydown="emit('editKeyDown', $event, parentCheckpointId)"
        />
        <div class="flex gap-1.5 justify-end">
          <button
            type="button"
            class="px-2.5 py-1 rounded text-xs text-text-secondary hover:bg-surface-tertiary transition-colors"
            @click="emit('update:editingId', null)"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors"
            @click="emit('edit', parentCheckpointId)"
          >
            Save &amp; Send
          </button>
        </div>
      </div>
    </div>
    <HumanBubble v-else-if="isHuman">{{ msg.text }}</HumanBubble>
    <AIBubble v-else>{{ msg.text }}</AIBubble>

    <div
      v-if="!isEditing && !isLoading"
      :class="['flex items-center gap-1 mt-1', isHuman ? 'flex-row-reverse mr-9' : 'ml-9']"
    >
      <button
        v-if="isHuman"
        type="button"
        :disabled="!parentCheckpointId"
        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-text-tertiary hover:text-text hover:bg-surface-tertiary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Edit"
        @click="
          emit('update:editingId', msg.id!);
          emit('update:editText', msg.text);
        "
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit
      </button>
      <button
        v-if="!isHuman"
        type="button"
        :disabled="!parentCheckpointId"
        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-text-tertiary hover:text-text hover:bg-surface-tertiary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Regenerate"
        @click="emit('regenerate', parentCheckpointId)"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        Regenerate
      </button>
    </div>
    <span hidden>{{ idx }}</span>
  </div>
</template>
