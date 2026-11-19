import { coerceMessageLikeToMessage, type BaseMessageLike } from "@langchain/core/messages";
import type { BaseMessage } from "langchain";

/** History API payloads may use `content_blocks` instead of `content`. */
export function historyToMessages(messages: unknown): BaseMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages.map((message) =>
    coerceMessageLikeToMessage(
      typeof message === "object" && message !== null && "content_blocks" in message
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
