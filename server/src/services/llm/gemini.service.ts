import { config } from "../../config.js";
import { ensureOk, requireApiKey } from "./http.js";
import type {
  LLMGenerateRequest,
  LLMGenerateResult,
  LLMMessage,
  LLMProvider,
  LLMService
} from "./types.js";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

type GeminiServiceOptions = {
  apiKey?: string;
  model?: string;
};

const textFromParts = (parts: unknown) => {
  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => {
      if (typeof part === "object" && part !== null && "text" in part) {
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      }

      return "";
    })
    .join("");
};

const firstCandidateText = (payload: unknown) => {
  if (typeof payload !== "object" || payload === null || !("candidates" in payload)) {
    return "";
  }

  const candidates = (payload as { candidates?: unknown }).candidates;

  if (!Array.isArray(candidates)) {
    return "";
  }

  const [candidate] = candidates;

  if (typeof candidate !== "object" || candidate === null || !("content" in candidate)) {
    return "";
  }

  const content = (candidate as { content?: { parts?: unknown } }).content;
  return textFromParts(content?.parts);
};

const usageFromPayload = (payload: unknown) => {
  if (typeof payload !== "object" || payload === null || !("usageMetadata" in payload)) {
    return undefined;
  }

  const usage = (payload as { usageMetadata?: Record<string, unknown> }).usageMetadata;

  if (!usage) {
    return undefined;
  }

  return {
    promptTokens:
      typeof usage.promptTokenCount === "number" ? usage.promptTokenCount : undefined,
    completionTokens:
      typeof usage.candidatesTokenCount === "number"
        ? usage.candidatesTokenCount
        : undefined,
    totalTokens:
      typeof usage.totalTokenCount === "number" ? usage.totalTokenCount : undefined
  };
};

const toGeminiRole = (role: LLMMessage["role"]) => {
  return role === "assistant" ? "model" : "user";
};

const toGeminiBody = (request: LLMGenerateRequest) => {
  const systemMessages = request.messages.filter((message) => message.role === "system");
  const conversationMessages = request.messages.filter((message) => message.role !== "system");

  return {
    contents: conversationMessages.map((message) => ({
      role: toGeminiRole(message.role),
      parts: [{ text: message.content }]
    })),
    ...(systemMessages.length > 0
      ? {
          systemInstruction: {
            parts: [{ text: systemMessages.map((message) => message.content).join("\n\n") }]
          }
        }
      : {}),
    generationConfig: {
      ...(typeof request.options?.temperature === "number"
        ? { temperature: request.options.temperature }
        : {}),
      ...(typeof request.options?.maxTokens === "number"
        ? { maxOutputTokens: request.options.maxTokens }
        : {}),
      ...(request.options?.stop ? { stopSequences: request.options.stop } : {})
    }
  };
};

async function* sseJson(response: Response): AsyncIterable<unknown> {
  if (!response.body) {
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const data = event
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n");

        if (!data || data === "[DONE]") {
          continue;
        }

        yield JSON.parse(data) as unknown;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export class GeminiService implements LLMService {
  readonly provider: LLMProvider = "gemini";
  private readonly apiKey: string;
  private readonly defaultModel: string;

  constructor(options: GeminiServiceOptions = {}) {
    this.apiKey = options.apiKey ?? config.llm.gemini.apiKey;
    this.defaultModel = options.model ?? config.llm.gemini.model;
  }

  async generate(request: LLMGenerateRequest): Promise<LLMGenerateResult> {
    requireApiKey("Gemini", this.apiKey);

    const model = request.options?.model ?? this.defaultModel;
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toGeminiBody(request))
      }
    );

    await ensureOk(response, "Gemini");
    const payload = (await response.json()) as unknown;

    return {
      provider: this.provider,
      model,
      content: firstCandidateText(payload),
      usage: usageFromPayload(payload)
    };
  }

  async *generateStream(request: LLMGenerateRequest): AsyncIterable<string> {
    requireApiKey("Gemini", this.apiKey);

    const model = request.options?.model ?? this.defaultModel;
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toGeminiBody(request))
      }
    );

    await ensureOk(response, "Gemini");

    for await (const payload of sseJson(response)) {
      const text = firstCandidateText(payload);

      if (text) {
        yield text;
      }
    }
  }
}



