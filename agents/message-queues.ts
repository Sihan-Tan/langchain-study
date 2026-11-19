import { createAgent } from "langchain";
import model from '../models/deepseek'

export const agent = createAgent({
  model: model,
});
