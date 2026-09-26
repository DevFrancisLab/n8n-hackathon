const TOKEN_KEY = "yakwetu.token";

function viteValue(name: "VITE_API_URL" | "VITE_USE_API") {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Single base URL for the Django REST API.
 * The frontend never calls n8n. Django receives events and forwards them.
 * VITE_API_URL wins when it is set. NEXT_PUBLIC_API_URL remains as a fallback.
 */
export function getApiBaseUrl() {
  const configured = viteValue("VITE_API_URL") || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  return configured.replace(/\/$/, "");
}

export function useRemoteApi() {
  const vite = viteValue("VITE_USE_API");
  if (vite === "true" || vite === "false") return vite === "true";
  return process.env.NEXT_PUBLIC_USE_API === "true";
}

export function saveApiToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) window.localStorage.removeItem(TOKEN_KEY);
  else window.localStorage.setItem(TOKEN_KEY, token);
}

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Token ${token}` } : {};
}

export async function readApiError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { detail?: string; error?: string } | null;
  return data?.detail || data?.error || fallback;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return fetch(`${getApiBaseUrl()}${normalized}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...authHeader(),
      ...init?.headers,
    },
  });
}
