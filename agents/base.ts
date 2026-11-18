import { createAgent } from "langchain";
import DeepSeekModel from "../models/deepseek";
import BaseAnswerOutput from "../outputs/answer";
import BASE_PROMPT from "../prompts/base";
import {weatherTool, searchWebTool, calculatorTool} from "../tools/index";
import stateMiddleware from "../middlewares/state";

export const tool_agent = createAgent({
    model: DeepSeekModel,
    systemPrompt: BASE_PROMPT,
    responseFormat: BaseAnswerOutput,
    tools: [weatherTool, searchWebTool, calculatorTool],
    middleware: [stateMiddleware],
});
