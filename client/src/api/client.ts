const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

let currentAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

export const getAccessToken = () => currentAccessToken;

type ApiError = Error & { status: number; data: unknown };

const messageFromPayload = (payload: unknown) => {
  if (typeof payload !== "object" || payload === null) return undefined;
  const data = payload as { error?: { message?: unknown }; message?: unknown };
  return typeof data.error?.message === "string" ? data.error.message : typeof data.message === "string" ? data.message : undefined;
};

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>)
  };

  if (currentAccessToken) {
    headers["Authorization"] = `Bearer ${currentAccessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include"
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(messageFromPayload(data) || `Request failed with status ${response.status}`) as ApiError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}
