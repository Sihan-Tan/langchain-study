import { createAgent } from "langchain";
import model from '../models/deepseekWithThinking'

export const agent = createAgent({
  model: model,
});
