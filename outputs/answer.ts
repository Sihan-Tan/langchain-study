import z from "zod";

const BaseAnswerOutput = z.object({summary: z.string(), confidence: z.number()})

export default BaseAnswerOutput;
