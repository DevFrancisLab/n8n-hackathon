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
import { apiFetch, useRemoteApi } from "./client";

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

async function readDetail(response: Response) {
  const data = (await response.json().catch(() => null)) as { detail?: string } | null;
  return data?.detail;
}

export async function signup(input: SignupInput): Promise<SessionUser> {
  if (useRemoteApi()) {
    const response = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new AuthError((await readDetail(response)) ?? "Could not create your account.");
    }
    const user = (await response.json()) as SessionUser;
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
    const response = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new AuthError((await readDetail(response)) ?? "Email or password is incorrect.");
    }
    const user = (await response.json()) as SessionUser;
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
  if (useRemoteApi()) {
    await apiFetch("/auth/logout", { method: "POST" });
  }
  removeKey(STORAGE_KEYS.session);
}

export async function getMe(): Promise<SessionUser | null> {
  if (useRemoteApi()) {
    const response = await apiFetch("/auth/me");
    if (!response.ok) {
      removeKey(STORAGE_KEYS.session);
      return null;
    }
    const user = (await response.json()) as SessionUser;
    writeJson(STORAGE_KEYS.session, user);
    return user;
  }
  return getSessionUser();
}
