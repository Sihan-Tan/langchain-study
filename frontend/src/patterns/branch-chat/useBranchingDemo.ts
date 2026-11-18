import { computed, inject, provide, ref, watch, type InjectionKey, type Ref } from "vue";
import type { BaseMessage } from "langchain";
import {
  useChannel,
  useMessageMetadata,
  useMessages,
  useStream,
  type UseStreamOptions,
  type UseStreamReturn,
} from "@langchain/vue";

import { AGENT_SERVER_URL, SLUG_TO_ASSISTANT } from "@/constants";
import { getBranchContext } from "@langchain/langgraph-sdk/ui";

import {
  buildBranchesList,
  buildHistoryMetadata,
  findBranchForCheckpoint,
  getLatestCheckpointId,
  mergeCheckpointEventsIntoHistory,
  messagesFromBranchHistory,
  pickLatestCheckpointIdFromHistory,
  type Branch,
  type BranchMetadata,
  type CheckpointsEvent,
  type ThreadHistoryState,
} from "./branching-logic";

export type BranchingContextValue = {
  branches: Ref<Branch[]>;
  activeBranch: Ref<string>;
  switchBranch: (branch: string) => void;
  forkFrom: (checkpointId: string | undefined, content?: string) => void;
  resetConversation: () => void;
  submitPrompt: (content: string) => void;
  isLoading: Ref<boolean>;
  error: Ref<unknown>;
  threadId: Ref<string | undefined>;
  messages: Ref<BaseMessage[]>;
  historyMetadata: Ref<Map<string, BranchMetadata>>;
  refreshHistory: () => Promise<void>;
  stream: UseStreamReturn;
};

const BranchingKey: InjectionKey<BranchingContextValue> = Symbol("branching-demo");

type BranchingDemoOptions = {
  apiUrl?: string;
  assistantId?: string;
  onCreated?: UseStreamOptions["onCreated"];
  onCompleted?: UseStreamOptions["onCompleted"];
};

export function provideBranchingDemo(options: BranchingDemoOptions = {}) {
  const apiUrl = options.apiUrl ?? AGENT_SERVER_URL;
  const assistantId = options.assistantId ?? SLUG_TO_ASSISTANT["branch-chat"];

  const threadId = ref<string | undefined>();
  const history = ref<ThreadHistoryState[]>([]);
  const historyError = ref<unknown>(undefined);
  const activeBranch = ref("");
  const shouldSelectForkHead = ref(false);
  const lastStreamCheckpointId = ref<string | undefined>();
  const wasLoading = ref(false);

  const stream = useStream({
    assistantId,
    apiUrl,
    threadId,
    onCreated: options.onCreated,
    onCompleted: options.onCompleted,
  });

  const checkpointEventsRef = useChannel(stream, ["checkpoints"], undefined, {
    replay: false,
  });

  const checkpointEvents = computed(() => checkpointEventsRef.value as CheckpointsEvent[]);

  const checkpointHistory = computed(() =>
    mergeCheckpointEventsIntoHistory(history.value, checkpointEvents.value),
  );

  watch(checkpointEvents, (events) => {
    const id = getLatestCheckpointId(events);
    if (typeof id === "string") lastStreamCheckpointId.value = id;
  });

  const refreshHistory = async () => {
    const tid = stream.threadId.value;
    if (!tid) return;
    try {
      const states = await stream.client.threads.getHistory(tid, { limit: 100 });
      const statesForBranching = states as ThreadHistoryState[];
      history.value = statesForBranching;
      historyError.value = undefined;
      if (shouldSelectForkHead.value) {
        shouldSelectForkHead.value = false;
        const mergedStates = mergeCheckpointEventsIntoHistory(
          statesForBranching,
          checkpointEvents.value,
        );
        const latestCheckpointId =
          lastStreamCheckpointId.value ??
          getLatestCheckpointId(checkpointEvents.value) ??
          pickLatestCheckpointIdFromHistory(statesForBranching);
        lastStreamCheckpointId.value = undefined;

        if (latestCheckpointId) {
          const forkBranch = findBranchForCheckpoint(latestCheckpointId, mergedStates);
          if (forkBranch != null) {
            activeBranch.value = forkBranch;
          }
        }
      }
    } catch (err) {
      historyError.value = err;
      history.value = [];
    }
  };

  watch(
    () => stream.isLoading.value,
    (loading) => {
      if (wasLoading.value && !loading) {
        void refreshHistory();
      }
      wasLoading.value = loading;
    },
  );

  const branchContext = computed(() =>
    getBranchContext(activeBranch.value, checkpointHistory.value),
  );

  const streamMessages = useMessages(stream);

  const branchMessages = computed(() => messagesFromBranchHistory(branchContext.value.flatHistory));

  const branchTipCheckpointId = computed(
    () => branchContext.value.threadHead?.checkpoint?.checkpoint_id,
  );

  const messages = computed(() => {
    if (stream.isLoading.value) {
      return streamMessages.value;
    }
    if (branchMessages.value.length > 0) {
      return branchMessages.value;
    }
    return streamMessages.value;
  });

  const historyMetadata = computed(() =>
    buildHistoryMetadata(messages.value, history.value, branchContext.value.branchByCheckpoint),
  );

  const branches = computed(() => buildBranchesList(branchContext.value.branchByCheckpoint));

  const switchBranch = (branch: string) => {
    activeBranch.value = branch === "main" ? "" : branch;
  };

  const forkFrom = (checkpointId: string | undefined, content?: string) => {
    if (!checkpointId || stream.isLoading.value) return;

    void stream.submit(content == null ? undefined : { messages: [{ content, type: "human" }] }, {
      forkFrom: checkpointId,
    });

    shouldSelectForkHead.value = true;
    setTimeout(() => void refreshHistory(), 1000);
  };

  const resetConversation = () => {
    threadId.value = undefined;
    history.value = [];
    historyError.value = undefined;
    activeBranch.value = "";
  };

  const submitPrompt = (content: string) => {
    const nextContent = content.trim();
    if (nextContent.length === 0 || stream.isLoading.value) return;

    const tip = branchTipCheckpointId.value;
    void stream.submit(
      { messages: [{ content: nextContent, type: "human" }] },
      tip != null ? { forkFrom: tip } : undefined,
    );
  };

  const value: BranchingContextValue = {
    branches,
    activeBranch,
    switchBranch,
    forkFrom,
    resetConversation,
    submitPrompt,
    isLoading: computed(() => stream.isLoading.value),
    error: computed(() => stream.error.value ?? historyError.value),
    threadId,
    messages,
    historyMetadata,
    refreshHistory,
    stream,
  };

  provide(BranchingKey, value);
  return value;
}

export function useBranchingDemo() {
  const context = inject(BranchingKey);
  if (context == null) {
    throw new Error("useBranchingDemo must be used inside provideBranchingDemo");
  }
  return context;
}

export function useBranchingMessageMetadata(messageId: Ref<string | null | undefined>) {
  const { historyMetadata, stream } = useBranchingDemo();
  const liveMetadata = useMessageMetadata(stream, () => messageId.value ?? undefined);
  const fallbackMetadata = computed(() =>
    messageId.value ? historyMetadata.value.get(messageId.value) : undefined,
  );

  return computed(() => ({
    ...fallbackMetadata.value,
    parentCheckpointId:
      fallbackMetadata.value?.parentCheckpointId ?? liveMetadata.value?.parentCheckpointId,
    branch: fallbackMetadata.value?.branch,
    siblingBranches: fallbackMetadata.value?.siblingBranches,
  }));
}
