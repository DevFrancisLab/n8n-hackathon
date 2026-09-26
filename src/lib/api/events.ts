import { movies } from "@/lib/data/movies";
import { createId } from "@/lib/utils";
import { getActiveCustomerId, getSessionUser, readJson, STORAGE_KEYS, writeJson } from "@/lib/storage";
import type { AppEvent, TrackEventInput } from "@/types";
import { apiFetch, hasApiToken, useRemoteApi } from "./client";

const recentKeys = new Map<string, number>();

export function listEvents(): AppEvent[] {
  return readJson<AppEvent[]>(STORAGE_KEYS.events, []);
}

export function clearEvents() {
  writeJson(STORAGE_KEYS.events, []);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("yakwetu:event"));
  }
}

function rememberLocally(event: AppEvent) {
  const all = listEvents();
  all.push(event);
  writeJson(STORAGE_KEYS.events, all.slice(-200));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("yakwetu:event"));
  }
}

export function rememberEventLocally(event: AppEvent) {
  rememberLocally(event);
  console.info("[YakWetu event]", event.event, event);
}

/**
 * Event delivery.
 * Now: console + localStorage, so /demo can show the journey offline.
 * Later: POST /api/events. Django owns the n8n webhook. Do not call n8n here.
 */
export function deliverEvent(event: AppEvent) {
  rememberLocally(event);
  console.info("[YakWetu event]", event.event, event);

  if (!useRemoteApi() || typeof window === "undefined") return;

  void apiFetch(
    "/events",
    {
      method: "POST",
      body: JSON.stringify(event),
    },
    { auth: hasApiToken() ? "required" : "public" },
  ).catch((error: unknown) => {
    console.warn("[YakWetu] Kept the event locally. Django /api/events is not reachable yet.", error);
  });
}

function isDuplicate(input: TrackEventInput, customerId: string) {
  const key = [input.event, customerId, input.movieId ?? "", input.checkoutId ?? ""].join("|");
  const now = Date.now();
  const previous = recentKeys.get(key) ?? 0;
  if (now - previous < 1200) return true;
  recentKeys.set(key, now);
  return false;
}

export function buildEvent(input: TrackEventInput): AppEvent | null {
  if (typeof window === "undefined") return null;
  const customerId = input.customerId ?? getActiveCustomerId();
  if (isDuplicate(input, customerId)) return null;

  const movie = input.movieId ? movies.find((item) => item.id === input.movieId) : undefined;
  const session = getSessionUser();
  const metadata = { ...input.metadata };
  if (movie && metadata.movie_title == null) metadata.movie_title = movie.title;
  if (!metadata.display_name) metadata.display_name = session?.name || "Guest";

  return {
    id: createId("evt"),
    event: input.event,
    customer_id: customerId,
    movie_id: input.movieId,
    checkout_id: input.checkoutId,
    timestamp: new Date().toISOString(),
    metadata,
  };
}
