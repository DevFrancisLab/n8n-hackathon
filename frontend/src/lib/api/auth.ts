import { trackEvent } from "@/lib/events";
import { createId } from "@/lib/utils";
import {
  claimGuestActivity,
  getSessionUser,
  readJson,
  removeKey,
  STORAGE_KEYS,
  writeJson,
} from "@/lib/storage";
import type { LoginInput, SessionUser, SignupInput, StoredUser } from "@/types";
import { apiFetch, hasApiToken, readApiError, saveApiToken, useRemoteApi } from "./client";

/**
 * Mock authentication for the hackathon UI.
 * Passwords live in this browser only and must not be reused in production.
 *
 * Later, replace each body with Django:
 *   POST /api/auth/signup
 *   POST /api/auth/login
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 */

export class AuthError extends Error {}

function readUsers() {
  return readJson<StoredUser[]>(STORAGE_KEYS.users, []);
}

function toSession(user: StoredUser): SessionUser {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone };
}

async function readDetail(response: Response, fallback: string) {
  return readApiError(response, fallback);
}

function sessionFrom(payload: SessionUser & { token?: string }): SessionUser {
  if (payload.token) saveApiToken(payload.token);
  return { id: String(payload.id), name: payload.name, email: payload.email, phone: payload.phone };
}

function credentials(input: { name?: string; email: string; phone?: string; password: string }) {
  return {
    ...input,
    email: input.email.trim().toLowerCase(),
    ...(input.name != null ? { name: input.name.trim() } : {}),
    ...(input.phone != null ? { phone: input.phone.trim() } : {}),
  };
}

async function postAuth(path: string, body: unknown) {
  try {
    return await apiFetch(path, { method: "POST", body: JSON.stringify(body) }, { auth: "none" });
  } catch {
    throw new AuthError("We couldn't reach YakWetu. Check your connection and try again.");
  }
}

export async function signup(input: SignupInput): Promise<SessionUser> {
  if (useRemoteApi()) {
    const response = await postAuth("/auth/signup", credentials(input));
    if (!response.ok) {
      throw new AuthError(await readDetail(response, "Could not create your account."));
    }
    const user = sessionFrom((await response.json()) as SessionUser & { token?: string });
    claimGuestActivity(user.id);
    writeJson(STORAGE_KEYS.session, user);
    trackEvent({
      event: "SIGNUP_COMPLETED",
      customerId: user.id,
      metadata: { display_name: user.name },
    });
    return user;
  }

  const email = input.email.trim().toLowerCase();
  const users = readUsers();
  if (users.some((user) => user.email.toLowerCase() === email)) {
    throw new AuthError("An account with that email already exists.");
  }

  const user: StoredUser = {
    id: createId("cus"),
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    password: input.password,
  };
  writeJson(STORAGE_KEYS.users, [...users, user]);
  const session = toSession(user);
  claimGuestActivity(session.id);
  writeJson(STORAGE_KEYS.session, session);
  trackEvent({
    event: "SIGNUP_COMPLETED",
    customerId: session.id,
    metadata: { display_name: session.name },
  });
  return session;
}

export async function login(input: LoginInput): Promise<SessionUser> {
  if (useRemoteApi()) {
    const response = await postAuth("/auth/login", credentials(input));
    if (response.status === 400 || response.status === 401) {
      throw new AuthError("Email or password is incorrect.");
    }
    if (!response.ok) {
      throw new AuthError(await readDetail(response, "Could not sign you in. Please try again."));
    }
    const user = sessionFrom((await response.json()) as SessionUser & { token?: string });
    claimGuestActivity(user.id);
    writeJson(STORAGE_KEYS.session, user);
    return user;
  }

  const email = input.email.trim().toLowerCase();
  const user = readUsers().find((item) => item.email.toLowerCase() === email);
  if (!user || user.password !== input.password) {
    throw new AuthError("Email or password is incorrect.");
  }
  const session = toSession(user);
  claimGuestActivity(session.id);
  writeJson(STORAGE_KEYS.session, session);
  return session;
}

export async function logout() {
  if (useRemoteApi() && hasApiToken()) {
    await apiFetch("/auth/logout", { method: "POST" }, { auth: "required" }).catch(() => undefined);
  }
  saveApiToken(null);
  removeKey(STORAGE_KEYS.session);
}

export async function getMe(): Promise<SessionUser | null> {
  if (useRemoteApi()) {
    if (!hasApiToken()) {
      removeKey(STORAGE_KEYS.session);
      return null;
    }
    let response: Response;
    try {
      response = await apiFetch("/auth/me", undefined, { auth: "required" });
    } catch {
      return getSessionUser();
    }
    if (response.status === 401) {
      saveApiToken(null);
      removeKey(STORAGE_KEYS.session);
      return null;
    }
    if (!response.ok) return getSessionUser();
    const user = sessionFrom((await response.json()) as SessionUser & { token?: string });
    writeJson(STORAGE_KEYS.session, user);
    return user;
  }
  return getSessionUser();
}
