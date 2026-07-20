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
