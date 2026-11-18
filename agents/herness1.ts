import { createAgent } from "langchain";
import {
  createFilesystemMiddleware,
  StateBackend,
  createSkillsMiddleware,
  createSummarizationMiddleware,
} from "deepagents";
import DeepSeekModel from "../models/deepseek";
import getWeather from "../tools/getWeather";

const backend = new StateBackend();

const agent = createAgent({
  model: DeepSeekModel,
  tools: [getWeather],
  middleware: [
    createFilesystemMiddleware({ backend }),
    createSummarizationMiddleware({ model: DeepSeekModel, backend }),
    createSkillsMiddleware({ backend, sources: ["C:\Users\tanx\.agents\skills"] }),
  ],
});

export default agent;
