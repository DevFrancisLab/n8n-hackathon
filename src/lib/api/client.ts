/**
 * Single base URL for the future Django REST API.
 * The frontend never calls n8n. Django receives events and forwards them.
 */
export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  return configured.replace(/\/$/, "");
}

export function useRemoteApi() {
  return process.env.NEXT_PUBLIC_USE_API === "true";
}

export async function apiFetch(path: string, init?: RequestInit) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return fetch(`${getApiBaseUrl()}${normalized}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}
