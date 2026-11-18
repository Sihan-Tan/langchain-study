import { createAgent, humanInTheLoopMiddleware } from "langchain";
import model from '../models/deepseek'

import { emailTool } from "../tools/index";


export const agent = createAgent({
  model,
  tools: [emailTool],
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        send_email: {
          allowedDecisions: ["approve", "edit", "reject"],
          description: "Review email before sending",
        },
      },
    }),
  ],
});
