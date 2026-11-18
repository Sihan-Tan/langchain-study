import { AIMessageChunk } from "langchain";
import model from "./models/deepseek";
import getWeather from "./tools/getWeather";

import * as z from "zod";

const Movie = z.object({
  title: z.string().describe("The title of the movie"),
  year: z.number().describe("The year the movie was released"),
  director: z.string().describe("The director of the movie"),
  rating: z.number().describe("The movie's rating out of 10"),
});

const modelWithStructure = model.withStructuredOutput(Movie, {includeRaw: true});

const response = await modelWithStructure.invoke("Provide details about the movie Inception");
console.log(response);
