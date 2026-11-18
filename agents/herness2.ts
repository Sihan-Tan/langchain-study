import { createAgent, todoListMiddleware } from "langchain";
import {
  createFilesystemMiddleware,
  createSubAgentMiddleware,
  StateBackend,
} from "deepagents";
import getWeather from "../tools/getWeather";
import DeepSeekModel from "../models/deepseek";

var backend = new StateBackend();

var agent = createAgent({
  model: DeepSeekModel,
  tools: [getWeather],
  middleware: [
    createFilesystemMiddleware({ backend }),
    todoListMiddleware(),
    createSubAgentMiddleware({
      defaultModel: DeepSeekModel,
      defaultTools: [],
      subagents: [
        {
          name: "researcher",
          description: "Searches and returns a structured summary.",
          systemPrompt:
            "Use the search tool to research the question and summarize key points.",
          tools: [getWeather],
          model: DeepSeekModel,
          middleware: [],
        },
      ],
    }),
  ],
});

export default agent;
