import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import MarkdownMessagesPreview from "@/patterns/markdown-messages/Preview.vue";
import ToolCallingPreview from "@/patterns/tool-calling/Preview.vue";
import HumanInTheLoopPreview from "@/patterns/human-in-the-loop/Preview.vue";
import PatternListView from "@/components/PatternListView.vue";

export const ROUTE_SLUGS = [
  "markdown-messages",
  "tool-calling",
  "human-in-the-loop",
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
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
