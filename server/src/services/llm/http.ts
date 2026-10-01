import { HttpError } from "../../middleware/error.js";

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

  throw new HttpError(
    502,
    `${provider} request failed with status ${response.status}${details}`
  );
};

export const fetchWithTimeout = async (url: string, options: RequestInit, provider: string) => {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(60_000) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new HttpError(504, `${provider} request timed out. Please try again.`);
    }

    throw error;
  }
};
