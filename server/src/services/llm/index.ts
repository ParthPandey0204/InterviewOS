import { GeminiService } from "./gemini.service.js";
import { GroqService } from "./groq.service.js";
import type { LLMProvider, LLMService } from "./types.js";

export type {
  LLMGenerateOptions,
  LLMGenerateRequest,
  LLMGenerateResult,
  LLMMessage,
  LLMProvider,
  LLMRole,
  LLMService
} from "./types.js";
export { GeminiService } from "./gemini.service.js";
export { GroqService } from "./groq.service.js";

export const createLLMService = (provider: LLMProvider): LLMService => {
  switch (provider) {
    case "gemini":
      return new GeminiService();
    case "groq":
      return new GroqService();
  }
};
