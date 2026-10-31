import { z } from "zod";
import { config } from "../config.js";
import { HttpError } from "../middleware/error.js";
import { buildEvaluationMessages, type EvaluationPromptVersion } from "./interview-prompts.service.js";
import { createLLMService, type LLMGenerateResult, type LLMProvider } from "./llm/index.js";
import { ProviderRateLimitError } from "./llm/http.js";
import { logUsage } from "./usage-log.service.js";

type EvaluateAnswerInput = {
  question: string;
  answer: string;
  provider?: LLMProvider;
  userId?: string;
  sessionId?: string;
  promptVersion?: EvaluationPromptVersion;
};

export const evaluationScoresSchema = z
  .object({
    correctness: z.number().int().min(0).max(5),
    clarity: z.number().int().min(0).max(5),
    depth: z.number().int().min(0).max(5)
  });

export type EvaluationScores = z.infer<typeof evaluationScoresSchema>;

const answerEvaluationSchema = evaluationScoresSchema.extend({
  feedback: z.string().trim().optional(),
  betterAnswer: z.string().trim().optional()
});

export type AnswerEvaluation = z.infer<typeof answerEvaluationSchema>;

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

export const validateEvaluationScores = (payload: unknown): AnswerEvaluation => {
  const result = answerEvaluationSchema.safeParse(payload);

  if (!result.success) {
    throw new HttpError(502, "Evaluation response failed schema validation", result.error.flatten());
  }

  return {
    ...result.data,
    feedback: result.data.feedback || "Use the score breakdown to identify the part of your explanation that needs the most work.",
    betterAnswer: result.data.betterAnswer || ""
  };
};

const defaultProvider = (): LLMProvider => {
  if (config.llm.defaultProvider === "gemini" || config.llm.defaultProvider === "groq") {
    return config.llm.defaultProvider;
  }

  throw new HttpError(400, "Provider must be gemini or groq");
};

export const evaluateAnswer = async (input: EvaluateAnswerInput) => {
  const provider = input.provider ?? defaultProvider();
  const providers: LLMProvider[] = [provider];
  const alternate: LLMProvider = provider === "gemini" ? "groq" : "gemini";
  const alternateConfigured = alternate === "gemini" ? Boolean(config.llm.gemini.apiKey) : Boolean(config.llm.groq.apiKey);
  if (alternateConfigured) providers.push(alternate);

  const messages = buildEvaluationMessages({
    question: input.question,
    answer: input.answer,
    version: input.promptVersion
  });
  let lastError: unknown;

  for (const currentProvider of providers) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const startedAt = Date.now();
      try {
        const result: LLMGenerateResult = await createLLMService(currentProvider).generate({
          messages,
          options: {
            maxTokens: 300,
            jsonMode: true,
            jsonSchema: {
              name: "answer_evaluation",
              schema: {
                type: "object",
                properties: {
                  correctness: { type: "integer", minimum: 0, maximum: 5 },
                  clarity: { type: "integer", minimum: 0, maximum: 5 },
                  depth: { type: "integer", minimum: 0, maximum: 5 },
                  feedback: { type: "string" },
                  betterAnswer: { type: "string" }
                },
                required: ["correctness", "clarity", "depth", "feedback", "betterAnswer"],
                additionalProperties: false
              }
            },
            temperature: input.promptVersion === "v1" ? 0.7 : 0
          }
        });
        const scores = validateEvaluationScores(parseJsonObject(result.content));
        await logUsage({
          userId: input.userId,
          sessionId: input.sessionId,
          provider: result.provider,
          model: result.model,
          operation: "answer.evaluate",
          latencyMs: Date.now() - startedAt,
          usage: result.usage,
          metadata: { status: "success" }
        }).catch((error) => console.error("Unable to record evaluation usage", error));

        return { provider: result.provider, model: result.model, scores };
      } catch (error) {
        lastError = error;
        await logUsage({
          userId: input.userId,
          sessionId: input.sessionId,
          provider: currentProvider,
          operation: "answer.evaluate",
          latencyMs: Date.now() - startedAt,
          metadata: {
            status: "error",
            error: error instanceof Error ? error.message : "Unknown LLM error"
          }
        }).catch((loggingError) => console.error("Unable to record evaluation failure", loggingError));

        if (attempt === 0 && error instanceof ProviderRateLimitError && error.retryAfterMs !== null && error.retryAfterMs <= 60_000) {
          await new Promise((resolve) => setTimeout(resolve, error.retryAfterMs! + 150));
          continue;
        }
        break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Answer evaluation failed");
};

