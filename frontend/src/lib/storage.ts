import type { SessionUser } from "@/types";

export const STORAGE_KEYS = {
  users: "yakwetu.users",
  session: "yakwetu.session",
  events: "yakwetu.events",
  checkouts: "yakwetu.checkouts",
  purchases: "yakwetu.purchases",
  cart: "yakwetu.cart",
  views: "yakwetu.views",
  progress: "yakwetu.progress",
  guest: "yakwetu.guest",
} as const;

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeKey(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export function getSessionUser(): SessionUser | null {
  return readJson<SessionUser | null>(STORAGE_KEYS.session, null);
}

export function getOrCreateGuestId(): string {
  const existing = readJson<string | null>(STORAGE_KEYS.guest, null);
  if (existing) return existing;
  const id = `guest_${Math.random().toString(36).slice(2, 10)}`;
  writeJson(STORAGE_KEYS.guest, id);
  return id;
}

export function getActiveCustomerId(): string {
  const session = getSessionUser();
  if (session?.id) return session.id;
  return getOrCreateGuestId();
}

export function claimGuestActivity(userId: string) {
  const guestId = readJson<string | null>(STORAGE_KEYS.guest, null);
  if (!guestId || guestId === userId) return;

  rewriteOwner(STORAGE_KEYS.checkouts, "customerId", guestId, userId);
  rewriteOwner(STORAGE_KEYS.purchases, "customerId", guestId, userId);
  rewriteOwner(STORAGE_KEYS.events, "customer_id", guestId, userId);
}

function rewriteOwner(key: string, field: string, from: string, to: string) {
  const rows = readJson<Array<Record<string, unknown>>>(key, []);
  writeJson(
    key,
    rows.map((row) => (row[field] === from ? { ...row, [field]: to } : row)),
  );
}
