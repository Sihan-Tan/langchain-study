import type { BaseMessage } from "langchain";
import type { InferToolCalls, ToolCallFromTool } from "@langchain/vue";
import type { agent as toolCallingAgent } from "@agents/tool_agent";
import type { deepSearchTool } from "@tools/deep-search";
import type { agent as joinRejoinAgent } from "@agents/join-rejoin";

export interface AgentState {
  messages: BaseMessage[];
}

export type AgentToolCalls =
  | InferToolCalls<typeof toolCallingAgent>
  /* used in async-iterator-tools */
  | ToolCallFromTool<typeof deepSearchTool>
  /* used in join-rejoin */
  | InferToolCalls<typeof joinRejoinAgent>;
