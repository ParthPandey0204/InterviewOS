import { HttpError } from "../../middleware/error.js";
import { config } from "../../config.js";

export class ProviderRateLimitError extends HttpError {
  constructor(provider: string, message: string, public retryAfterMs: number | null) {
    super(429, `${provider} request failed with status 429${message ? `: ${message}` : ""}`);
  }
}

export class ProviderOutputTruncatedError extends Error {
  constructor(provider: string) {
    super(`${provider} response was truncated by the output token limit`);
    this.name = "ProviderOutputTruncatedError";
  }
}

const retryAfterMilliseconds = (response: Response) => {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter) return null;
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(retryAfter);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
};

export const requireApiKey = (provider: string, apiKey: string) => {
  if (!apiKey) {
    throw new HttpError(500, `${provider} API key is not configured`);
  }
};

export const ensureOk = async (response: Response, provider: string) => {
  if (response.ok) {
    return;
  }

  const body = await response.text();
  const details = body ? `: ${body}` : "";

  if (response.status === 429) {
    throw new ProviderRateLimitError(provider, body, retryAfterMilliseconds(response));
  }

  throw new HttpError(
    502,
    `${provider} request failed with status ${response.status}${details}`
  );
};

export const fetchWithTimeout = async (url: string, options: RequestInit, provider: string) => {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(config.llmRequestTimeoutMs) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new HttpError(504, `${provider} request timed out. Please try again.`);
    }

    throw error;
  }
};
