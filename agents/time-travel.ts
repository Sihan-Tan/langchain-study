import { createAgent } from "langchain";
import model from '../models/deepseek';
import { weatherTool, calculatorTool } from "../tools/index.js";

export const agent = createAgent({
  model: model,
  tools: [weatherTool, calculatorTool],
});
