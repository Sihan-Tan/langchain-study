import { tool } from "langchain";
import { z } from "zod";

export const deepSearchTool = tool(
  async function* ({ query }: { query: string }) {
    const sources = ["Wikipedia", "ArXiv", "Stack Overflow", "GitHub"];
    yield { status: "starting", query, total: sources.length, completed: 0 };
    const results = [];
    for (let i = 0; i < sources.length; i++) {
      await new Promise((r) => setTimeout(r, 500));
      results.push({
        source: sources[i],
        title: `${sources[i]} result for "${query}"`,
        relevant: true,
      });
      yield {
        status: "searching",
        query,
        total: sources.length,
        completed: i + 1,
        latest: sources[i],
      };
    }
    yield { status: "complete", query, total: sources.length, completed: sources.length };
    return JSON.stringify(results);
  },
  {
    name: "deep_search",
    description: "Search multiple sources for information with progress updates",
    schema: z.object({ query: z.string().describe("The search query") }),
  },
);
