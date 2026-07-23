import { z } from "zod";
import { config } from "../config.js";
import { HttpError } from "../middleware/error.js";
import { buildEvaluationMessages } from "./interview-prompts.service.js";
import { createLLMService, type LLMProvider } from "./llm/index.js";

type EvaluateAnswerInput = {
  question: string;
  answer: string;
  provider?: LLMProvider;
};

export const evaluationScoresSchema = z
  .object({
    correctness: z.number().int().min(0).max(5),
    clarity: z.number().int().min(0).max(5),
    depth: z.number().int().min(0).max(5)
  })
  .strict();

export type EvaluationScores = z.infer<typeof evaluationScoresSchema>;

const parseJsonObject = (content: string) => {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new HttpError(502, "Evaluation response did not contain JSON");
    }

    return JSON.parse(match[0]) as unknown;
  }
};

export const validateEvaluationScores = (payload: unknown): EvaluationScores => {
  const result = evaluationScoresSchema.safeParse(payload);

  if (!result.success) {
    throw new HttpError(502, "Evaluation response failed schema validation", result.error.flatten());
  }

  return result.data;
};

const defaultProvider = (): LLMProvider => {
  if (config.llm.defaultProvider === "gemini" || config.llm.defaultProvider === "groq") {
    return config.llm.defaultProvider;
  }

  throw new HttpError(400, "Provider must be gemini or groq");
};

export const evaluateAnswer = async (input: EvaluateAnswerInput) => {
  const llm = createLLMService(input.provider ?? defaultProvider());
  const result = await llm.generate({
    messages: buildEvaluationMessages({
      question: input.question,
      answer: input.answer
    }),
    options: {
      temperature: 0,
      maxTokens: 120
    }
  });

  return {
    provider: result.provider,
    model: result.model,
    scores: validateEvaluationScores(parseJsonObject(result.content))
  };
};
