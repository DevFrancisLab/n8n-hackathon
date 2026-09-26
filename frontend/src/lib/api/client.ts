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

export function hasApiToken() {
  return typeof window !== "undefined" && Boolean(window.localStorage.getItem(TOKEN_KEY));
}

export function saveApiToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) window.localStorage.removeItem(TOKEN_KEY);
  else window.localStorage.setItem(TOKEN_KEY, token);
}

const authFailureListeners = new Set<() => void>();

export function onAuthFailure(listener: () => void) {
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}

function notifyAuthFailure() {
  saveApiToken(null);
  for (const listener of authFailureListeners) listener();
}

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Token ${token}` } : {};
}

export async function readApiError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { detail?: string; error?: string } | null;
  const message = data?.detail || data?.error || "";
  if (!message || message.length > 180 || /traceback|<html/i.test(message)) return fallback;
  return message;
}

type AuthMode = "none" | "public" | "required";

export async function apiFetch(path: string, init?: RequestInit, options?: { auth?: AuthMode }) {
  return request(path, init, options?.auth ?? "public", false);
}

async function request(path: string, init: RequestInit | undefined, auth: AuthMode, retried: boolean) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const sendToken = auth !== "none" && hasApiToken();
  const response = await fetch(`${getApiBaseUrl()}${normalized}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(sendToken ? authHeader() : {}),
      ...init?.headers,
    },
  });

  if (response.status !== 401 || !sendToken || retried) return response;

  notifyAuthFailure();
  if (auth === "public") return request(path, init, "none", true);
  return response;
}
