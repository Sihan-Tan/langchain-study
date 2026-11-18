import { createAgent } from "langchain";
import model from '../models/deepseek'
import { z } from "zod";

const MathSolutionSchema = z.object({
  problem: z.string(),
  steps: z.array(
    z.object({
      explanation: z.string(),
      latex: z.string(),
    }),
  ),
  finalAnswer: z.string(),
  finalAnswerLatex: z.string(),
});
export type MathSolution = z.infer<typeof MathSolutionSchema>;

export const agent = createAgent({
  model: model,
  systemPrompt:
    "You are a math tutor. Solve the problem step by step. For each step, provide a clear explanation and the LaTeX representation. Use proper LaTeX notation (e.g., \\frac{a}{b}, x^2, \\sqrt{x}).",
  responseFormat: MathSolutionSchema,
});
