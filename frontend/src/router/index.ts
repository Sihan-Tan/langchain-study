import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import MarkdownMessagesPreview from "@/patterns/markdown-messages/Preview.vue";
import ToolCallingPreview from "@/patterns/tool-calling/Preview.vue";
import HumanInTheLoopPreview from "@/patterns/human-in-the-loop/Preview.vue";
import BranchChatPreview from "@/patterns/branch-chat/Preview.vue";
import ReasoningTokensPreview from "@/patterns/reasoning-tokens/Preview.vue";
import StructuredOutputPreview from "@/patterns/structured-output/Preview.vue";

import PatternListView from "@/components/PatternListView.vue";

export const ROUTE_SLUGS = [
  "markdown-messages",
  "tool-calling",
  "human-in-the-loop",
  "branch-chat",
  "reasoning-tokens",
  "structured-output",
] as const;

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: PatternListView,
    props: {
      slugs: [...ROUTE_SLUGS],
      frameworkLabel: "LangChain Vue Patterns",
    },
  },
  {
    path: "/markdown-messages",
    name: "markdown-messages",
    component: MarkdownMessagesPreview,
  },
  {
    path: "/tool-calling",
    name: "tool-calling",
    component: ToolCallingPreview,
  },
  {
    path: "/human-in-the-loop",
    name: "human-in-the-loop",
    component: HumanInTheLoopPreview,
  },
  {
    path: "/branch-chat",
    name: "branch-chat",
    component: BranchChatPreview,
  },
  {
    path: "/reasoning-tokens",
    name: "reasoning-tokens",
    component: ReasoningTokensPreview,
  },
  {
    path: "/structured-output",
    name: "structured-output",
    component: StructuredOutputPreview,
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
