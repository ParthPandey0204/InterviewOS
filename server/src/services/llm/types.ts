export type LLMProvider = "gemini" | "groq";

export type LLMRole = "system" | "user" | "assistant";

export type LLMMessage = {
  role: LLMRole;
  content: string;
};

export type LLMGenerateOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
};

export type LLMGenerateRequest = {
  messages: LLMMessage[];
  options?: LLMGenerateOptions;
};

export type LLMGenerateResult = {
  provider: LLMProvider;
  model: string;
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

export interface LLMService {
  readonly provider: LLMProvider;
  generate(request: LLMGenerateRequest): Promise<LLMGenerateResult>;
  generateStream(request: LLMGenerateRequest): AsyncIterable<string>;
}
