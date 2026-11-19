import { createAgent } from "langchain";
import model from '../models/deepseek';
import {researchTool} from '../tools/research';

export const agent = createAgent({
  model: model,
 tools: [researchTool],
  systemPrompt:
    "You are a thorough research assistant. Always use the research tool to gather information before answering. Research multiple aspects of the topic.",
});
