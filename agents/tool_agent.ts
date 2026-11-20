import { createAgent } from "langchain";
import DeepSeekModel from "../models/deepseek";
import BaseAnswerOutput from "../outputs/answer";
import BASE_PROMPT from "../prompts/base";
import {weatherTool, searchWebTool, calculatorTool} from "../tools/index";
import stateMiddleware from "../middlewares/state";
import { contentFilterMiddleware } from "../middlewares/custom-guard";

export const agent = createAgent({
    model: DeepSeekModel,
    systemPrompt: BASE_PROMPT,
    responseFormat: BaseAnswerOutput,
    tools: [weatherTool, searchWebTool, calculatorTool],
    middleware: [stateMiddleware, contentFilterMiddleware(["hack", "exploit", "malware"])],
});
