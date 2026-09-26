import { apiFetch, readApiError, useRemoteApi } from "@/lib/api/client";
import { listEvents, rememberEventLocally } from "@/lib/api/events";
import { trackEvent } from "@/lib/events";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage";

export function getRecentViewIds() {
  return readJson<string[]>(STORAGE_KEYS.views, []);
}

export function rememberView(movieId: string) {
  const views = getRecentViewIds().filter((id) => id !== movieId);
  writeJson(STORAGE_KEYS.views, [movieId, ...views].slice(0, 12));
}

export function getProgressMap() {
  return readJson<Record<string, number>>(STORAGE_KEYS.progress, {});
}

export function getProgress(movieId: string) {
  return getProgressMap()[movieId] ?? 0;
}

export function saveProgress(movieId: string, value: number) {
  const all = getProgressMap();
  all[movieId] = Math.max(0, Math.min(100, value));
  writeJson(STORAGE_KEYS.progress, all);
}

export async function completeWatch(movieId: string, duration: number) {
  if (useRemoteApi()) {
    const response = await apiFetch(
      "/watch",
      {
        method: "POST",
        body: JSON.stringify({ movieId }),
      },
      { auth: "required" },
    );
    if (!response.ok) throw new Error(await readApiError(response, "Could not mark this movie as watched."));
    const data = (await response.json()) as { events?: Parameters<typeof rememberEventLocally>[0][] };
    for (const event of data.events ?? []) rememberEventLocally(event);
    return;
  }
  trackEvent({
    event: "WATCH_COMPLETED",
    movieId,
    metadata: { duration },
  });
}

export function hasWatched(movieId: string, customerId: string) {
  return listEvents().some(
    (event) =>
      event.event === "WATCH_COMPLETED" &&
      event.movie_id === movieId &&
      event.customer_id === customerId,
  );
}

export function watchedMovieIds(customerId: string) {
  const ids: string[] = [];
  for (const event of [...listEvents()].reverse()) {
    if (event.event !== "WATCH_COMPLETED" || event.customer_id !== customerId || !event.movie_id) {
      continue;
    }
    if (!ids.includes(event.movie_id)) ids.push(event.movie_id);
  }
  return ids;
}
