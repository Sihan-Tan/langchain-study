import { coerceMessageLikeToMessage, type BaseMessageLike } from "@langchain/core/messages";
import type { BaseMessage } from "langchain";
import type { ThreadState } from "@langchain/langgraph-sdk";
import { getBranchContext } from "@langchain/langgraph-sdk/ui";

export interface CheckpointsEvent {
  method: "checkpoints";
  params: {
    namespace: string[];
    timestamp: number;
    data: {
      id: string;
      parent_id?: string;
      step: number;
      source: "input" | "loop" | "update" | "fork";
    };
  };
}

export type ThreadHistoryState = ThreadState<Record<string, unknown>>;

export type Branch = {
  checkpointId: string;
  label: string;
};

export interface BranchMetadata {
  parentCheckpointId?: string;
  branch?: string;
  siblingBranches?: string[];
}

export function findBranchForCheckpoint(
  checkpointId: string | undefined,
  history: ThreadHistoryState[],
) {
  if (!checkpointId) return undefined;

  const queue = [""];
  const seen = new Set(queue);

  while (queue.length > 0) {
    const branch = queue.shift()!;
    const branchContext = getBranchContext(branch, history) as {
      branchByCheckpoint: Record<string, { branch?: string; branchOptions?: string[] }>;
    };

    const checkpointBranch = branchContext.branchByCheckpoint[checkpointId];
    if (checkpointBranch != null) {
      return checkpointBranch.branch ?? branch;
    }

    for (const branchData of Object.values(branchContext.branchByCheckpoint)) {
      for (const branchOption of branchData.branchOptions ?? []) {
        if (!seen.has(branchOption)) {
          seen.add(branchOption);
          queue.push(branchOption);
        }
      }
    }
  }

  return undefined;
}

export function mergeCheckpointEventsIntoHistory(
  history: ThreadHistoryState[],
  checkpointEvents: CheckpointsEvent[],
) {
  const byCheckpoint = new Map<string, ThreadHistoryState>();
  for (const state of history) {
    const checkpointId = state.checkpoint?.checkpoint_id;
    if (checkpointId != null) {
      byCheckpoint.set(checkpointId, state);
    }
  }

  const liveStates: ThreadHistoryState[] = [];
  for (const event of checkpointEvents) {
    if (event.method !== "checkpoints") continue;

    const id = event.params?.data?.id;
    if (typeof id !== "string" || byCheckpoint.has(id)) continue;

    const parentId = event.params?.data?.parent_id;
    const state = syntheticThreadStateFromCheckpointEvent(id, parentId);
    byCheckpoint.set(id, state);
    liveStates.unshift(state);
  }

  return [...liveStates, ...history];
}

function syntheticThreadStateFromCheckpointEvent(
  checkpointId: string,
  parentId: unknown,
): ThreadHistoryState {
  const checkpoint = {
    thread_id: "",
    checkpoint_ns: "",
    checkpoint_id: checkpointId,
    checkpoint_map: undefined,
  };
  return {
    values: {},
    next: [],
    checkpoint,
    metadata: undefined,
    created_at: undefined,
    parent_checkpoint:
      typeof parentId === "string"
        ? {
            thread_id: "",
            checkpoint_ns: "",
            checkpoint_id: parentId,
            checkpoint_map: undefined,
          }
        : undefined,
    tasks: [],
  };
}

export function getLatestCheckpointId(checkpointEvents: CheckpointsEvent[]) {
  for (let index = checkpointEvents.length - 1; index >= 0; index -= 1) {
    const id = checkpointEvents[index].params?.data?.id;
    if (typeof id === "string") return id;
  }
  return undefined;
}

export function pickLatestCheckpointIdFromHistory(
  states: ThreadHistoryState[],
): string | undefined {
  let bestId: string | undefined;
  let bestTime = -Infinity;
  for (const state of states) {
    const id = state.checkpoint?.checkpoint_id;
    if (typeof id !== "string") continue;
    const time =
      typeof state.created_at === "string"
        ? Date.parse(state.created_at)
        : typeof state.created_at === "number"
          ? state.created_at
          : NaN;
    const t = Number.isFinite(time) ? time : 0;
    if (bestId == null || t > bestTime || (t === bestTime && id > bestId)) {
      bestTime = t;
      bestId = id;
    }
  }
  return bestId;
}

/** History API payloads may use `content_blocks` instead of `content`. */
export function historyToMessages(messages: unknown): BaseMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages.map((message) =>
    coerceMessageLikeToMessage(
      typeof message === "object" && message != null && "content_blocks" in message
        ? ({
            ...(message as object),
            content:
              (message as { content_blocks?: unknown; content?: unknown }).content_blocks ??
              (message as { content?: unknown }).content,
          } as BaseMessageLike)
        : (message as BaseMessageLike),
    ),
  );
}

/** Last checkpoint in the branch with non-empty messages (streaming synthetics often have empty values). */
export function messagesFromBranchHistory(flatHistory: ThreadHistoryState[]): BaseMessage[] {
  for (let index = flatHistory.length - 1; index >= 0; index -= 1) {
    const state = flatHistory[index];
    const raw =
      state.values != null && !Array.isArray(state.values) ? state.values.messages : undefined;
    const messages = historyToMessages(raw);
    if (messages.length > 0) return messages;
  }
  return [];
}

export function buildHistoryMetadata(
  messages: BaseMessage[],
  history: ThreadHistoryState[],
  branchByCheckpoint: Record<string, { branch?: string; branchOptions?: string[] }>,
): Map<string, BranchMetadata> {
  const byMessageId = new Map<string, BranchMetadata>();
  const alreadyShownBranches = new Set<string>();

  for (const message of messages) {
    const id = message.id;
    if (!id) continue;

    let firstSeenState: ThreadHistoryState | undefined;
    for (let index = history.length - 1; index >= 0; index -= 1) {
      const state = history[index];
      const rawMessages =
        state.values != null && !Array.isArray(state.values) ? state.values.messages : undefined;
      const messageIds = historyToMessages(rawMessages).map((historyMessage) => historyMessage.id);
      if (messageIds.includes(id)) {
        firstSeenState = state;
        break;
      }
    }

    const checkpointId = firstSeenState?.checkpoint?.checkpoint_id;
    const branchData = checkpointId == null ? undefined : branchByCheckpoint[checkpointId];

    let branchMetadata =
      !branchData?.branch || branchData.branch.length === 0 ? undefined : branchData;
    const siblingBranchesKey = branchMetadata?.branchOptions?.join(",");
    if (siblingBranchesKey) {
      if (alreadyShownBranches.has(siblingBranchesKey)) {
        branchMetadata = undefined;
      }
      alreadyShownBranches.add(siblingBranchesKey);
    }

    const parentCheckpointId = firstSeenState?.parent_checkpoint?.checkpoint_id;
    if (!parentCheckpointId) {
      continue;
    }

    byMessageId.set(id, {
      parentCheckpointId,
      branch: branchMetadata?.branch,
      siblingBranches: branchMetadata?.branchOptions,
    });
  }

  return byMessageId;
}

export function buildBranchesList(
  branchByCheckpoint: Record<string, { branch?: string; branchOptions?: string[] }>,
): Branch[] {
  const seen = new Set<string>();
  const result: Branch[] = [];

  for (const checkpointId of Object.keys(branchByCheckpoint)) {
    const branchData = branchByCheckpoint[checkpointId];
    for (const branchName of branchData?.branchOptions ?? []) {
      if (!seen.has(branchName)) {
        seen.add(branchName);
        result.push({ checkpointId, label: branchName });
      }
    }
  }

  if (result.length === 0) {
    result.push({ checkpointId: "", label: "main" });
  }

  return result;
}
