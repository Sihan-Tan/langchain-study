import { ChatOpenAI } from "@langchain/openai";

import "dotenv/config";

const DeepSeekModel = new ChatOpenAI({
  model: process.env.DEEPSEEK_MODEL,
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: process.env.DEEPSEEK_BASE_URL,
  },
  // deepseek-v4 思考模式默认开启，但思考模式下不支持 tool_choice，
  // 而 ReAct 循环依赖 bindTools 设置 tool_choice，因此必须显式关闭思考模式
  modelKwargs: {
  },
});

export default DeepSeekModel;
