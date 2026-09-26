import { getMovie, getMovies } from "@/lib/api/movies";
import { apiFetch, useRemoteApi } from "@/lib/api/client";
import { recommendForPrompt } from "@/lib/recommendations";
import type { Recommendation } from "@/types";

export const CONCIERGE_CHOICES = [
  {
    id: "kenyan-thriller",
    label: "Kenyan thriller",
    prompt: "I want a Kenyan thriller with a strong story.",
  },
  {
    id: "african-drama",
    label: "African drama",
    prompt: "I want an African drama.",
  },
  {
    id: "funny",
    label: "Something funny",
    prompt: "Something funny.",
  },
  {
    id: "family",
    label: "Family night",
    prompt: "A film for family night.",
  },
  {
    id: "romance",
    label: "Romance",
    prompt: "A romance.",
  },
  {
    id: "intense",
    label: "Something intense",
    prompt: "Something intense.",
  },
  {
    id: "hidden-gem",
    label: "Hidden gem",
    prompt: "A hidden gem.",
  },
] as const;

/**
 * Concierge boundary.
 * Now: deterministic matching against the demo catalog.
 * Later: POST /api/concierge { prompt } -> { movie_id, reason }
 * A model can replace recommendForPrompt without changing the page.
 */
export async function requestConciergeRecommendation(prompt: string): Promise<Recommendation> {
  if (useRemoteApi()) {
    const response = await apiFetch("/concierge", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) throw new Error("The concierge is unavailable. Please try again.");
    const data = (await response.json()) as { movie_id: string; reason: string };
    const movie = await getMovie(data.movie_id);
    if (!movie) throw new Error("The concierge returned an unknown movie.");
    return { movie, reason: data.reason };
  }

  const catalog = await getMovies();
  const match = recommendForPrompt(prompt, catalog);
  if (!match) throw new Error("Tell YakWetu what you want to watch.");
  return match;
}
