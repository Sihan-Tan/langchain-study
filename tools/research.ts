import { tool } from "langchain";
import { z } from "zod";

export const researchTool = tool(
  async ({ topic }) => {
    await new Promise((r) => setTimeout(r, 3000));
    return JSON.stringify({
      topic,
      findings: [
        `${topic} has seen significant evolution over the past decade.`,
        `Key advantages include developer experience and ecosystem size.`,
        `Community adoption continues to grow steadily.`,
      ],
    });
  },
  {
    name: "research",
    description: "Research a topic in depth (takes a few seconds)",
    schema: z.object({ topic: z.string() }),
  },
);
