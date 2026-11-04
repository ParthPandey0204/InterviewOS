const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

let currentAccessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;
const accessTokenListeners = new Set<(token: string | null) => void>();

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
  accessTokenListeners.forEach((listener) => listener(token));
};

export const getAccessToken = () => currentAccessToken;

export const subscribeToAccessToken = (listener: (token: string | null) => void) => {
  accessTokenListeners.add(listener);
  return () => {
    accessTokenListeners.delete(listener);
  };
};

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
  const response = await apiFetch(endpoint, options);

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

const refreshAccessToken = () => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        });
        if (!response.ok) {
          setAccessToken(null);
          return null;
        }

        const payload = await response.json().catch(() => null) as { accessToken?: unknown } | null;
        if (typeof payload?.accessToken !== "string") {
          setAccessToken(null);
          return null;
        }

        setAccessToken(payload.accessToken);
        return payload.accessToken;
      } catch {
        setAccessToken(null);
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
};

const isAuthEndpoint = (pathname: string) =>
  /\/api\/auth\/(login|register|refresh)$/.test(pathname);

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const pathname = new URL(url).pathname;

  const makeRequest = (token: string | null) => {
    const headers = new Headers(options.headers);
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    if (!headers.has("Content-Type") && options.body !== undefined && !isFormData) {
      headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);

    return fetch(url, { ...options, headers, credentials: "include" });
  };

  const requestToken = currentAccessToken;
  const response = await makeRequest(requestToken);
  if (response.status !== 401 || isAuthEndpoint(pathname) || options.signal?.aborted) {
    return response;
  }

  // Another request may already have refreshed the token while this request was in flight.
  const retryToken = currentAccessToken && currentAccessToken !== requestToken
    ? currentAccessToken
    : await refreshAccessToken();

  return retryToken && !options.signal?.aborted ? makeRequest(retryToken) : response;
}
