import { config } from "../config.js";
import { HttpError } from "../middleware/error.js";
import { buildEvaluationMessages, type EvaluationScores } from "./interview-prompts.service.js";
import { createLLMService, type LLMProvider } from "./llm/index.js";

type EvaluateAnswerInput = {
  question: string;
  answer: string;
  provider?: LLMProvider;
};

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

const validateScore = (payload: Record<string, unknown>, key: keyof EvaluationScores): number => {
  const value = payload[key];

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 5) {
    throw new HttpError(502, `Evaluation field ${key} must be an integer from 0 to 5`);
  }

  return value;
};

export const validateEvaluationScores = (payload: unknown): EvaluationScores => {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new HttpError(502, "Evaluation response must be a JSON object");
  }

  const record = payload as Record<string, unknown>;

  return {
    correctness: validateScore(record, "correctness"),
    clarity: validateScore(record, "clarity"),
    depth: validateScore(record, "depth")
  };
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


