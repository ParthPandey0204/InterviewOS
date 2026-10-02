import { UsageProvider } from "@prisma/client";
import { config } from "../config.js";
import { prisma } from "../prisma/client.js";
import type { LLMProvider } from "./llm/index.js";

type UsageInput = {
  userId?: string;
  sessionId?: string;
  provider: LLMProvider;
  model?: string;
  operation: string;
  latencyMs: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  metadata?: Record<string, unknown>;
};

const toUsageProvider = (provider: LLMProvider) => {
  switch (provider) {
    case "gemini":
      return UsageProvider.GEMINI;
    case "groq":
      return UsageProvider.GROQ;
  }
};

const estimatedCostUsd = (provider: LLMProvider, promptTokens: number, completionTokens: number) => {
  // Conservative public-list-price estimates; keep these visible as estimates in analytics.
  const rates = provider === "gemini" ? { input: 0.30, output: 2.50 } : { input: 0.05, output: 0.08 };
  return (promptTokens / 1_000_000) * rates.input + (completionTokens / 1_000_000) * rates.output;
};

export const defaultModelForProvider = (provider: LLMProvider) => {
  switch (provider) {
    case "gemini":
      return config.llm.gemini.model;
    case "groq":
      return config.llm.groq.model;
  }
};

export const logUsage = async (input: UsageInput) => {
  const promptTokens = input.usage?.promptTokens ?? 0;
  const completionTokens = input.usage?.completionTokens ?? 0;
  const totalTokens = input.usage?.totalTokens ?? promptTokens + completionTokens;

  await prisma.usageLog.create({
    data: {
      userId: input.userId,
      sessionId: input.sessionId,
      provider: toUsageProvider(input.provider),
      model: input.model ?? defaultModelForProvider(input.provider),
      operation: input.operation,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd: estimatedCostUsd(input.provider, promptTokens, completionTokens),
      metadata: {
        latencyMs: input.latencyMs,
        ...input.metadata
      }
    }
  });
};
