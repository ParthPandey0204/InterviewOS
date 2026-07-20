import { config } from "../../config.js";
import { ensureOk, requireApiKey } from "./http.js";
import type {
  LLMGenerateRequest,
  LLMGenerateResult,
  LLMProvider,
  LLMService
} from "./types.js";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

type GroqServiceOptions = {
  apiKey?: string;
  model?: string;
};

type GroqChoice = {
  message?: { content?: unknown };
  delta?: { content?: unknown };
};

const choicesFromPayload = (payload: unknown) => {
  if (typeof payload !== "object" || payload === null || !("choices" in payload)) {
    return [] as GroqChoice[];
  }

  const choices = (payload as { choices?: unknown }).choices;
  return Array.isArray(choices) ? (choices as GroqChoice[]) : [];
};

const usageFromPayload = (payload: unknown) => {
  if (typeof payload !== "object" || payload === null || !("usage" in payload)) {
    return undefined;
  }

  const usage = (payload as { usage?: Record<string, unknown> }).usage;

  if (!usage) {
    return undefined;
  }

  return {
    promptTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined,
    completionTokens:
      typeof usage.completion_tokens === "number" ? usage.completion_tokens : undefined,
    totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : undefined
  };
};

const toGroqBody = (request: LLMGenerateRequest, model: string, stream: boolean) => ({
  model,
  messages: request.messages.map((message) => ({
    role: message.role,
    content: message.content
  })),
  stream,
  ...(typeof request.options?.temperature === "number"
    ? { temperature: request.options.temperature }
    : {}),
  ...(typeof request.options?.maxTokens === "number"
    ? { max_tokens: request.options.maxTokens }
    : {}),
  ...(request.options?.stop ? { stop: request.options.stop } : {})
});

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

export class GroqService implements LLMService {
  readonly provider: LLMProvider = "groq";
  private readonly apiKey: string;
  private readonly defaultModel: string;

  constructor(options: GroqServiceOptions = {}) {
    this.apiKey = options.apiKey ?? config.llm.groq.apiKey;
    this.defaultModel = options.model ?? config.llm.groq.model;
  }

  async generate(request: LLMGenerateRequest): Promise<LLMGenerateResult> {
    requireApiKey("Groq", this.apiKey);

    const model = request.options?.model ?? this.defaultModel;
    const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(toGroqBody(request, model, false))
    });

    await ensureOk(response, "Groq");
    const payload = (await response.json()) as unknown;
    const [choice] = choicesFromPayload(payload);
    const content = choice?.message?.content;

    return {
      provider: this.provider,
      model,
      content: typeof content === "string" ? content : "",
      usage: usageFromPayload(payload)
    };
  }

  async *generateStream(request: LLMGenerateRequest): AsyncIterable<string> {
    requireApiKey("Groq", this.apiKey);

    const model = request.options?.model ?? this.defaultModel;
    const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(toGroqBody(request, model, true))
    });

    await ensureOk(response, "Groq");

    for await (const payload of sseJson(response)) {
      const [choice] = choicesFromPayload(payload);
      const content = choice?.delta?.content;

      if (typeof content === "string" && content) {
        yield content;
      }
    }
  }
}
