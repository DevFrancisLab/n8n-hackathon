import { movies } from "@/lib/data/movies";
import type { Movie, MovieFilters } from "@/types";
import { apiFetch, useRemoteApi } from "./client";

/**
 * Movie catalog.
 * Mock: src/lib/data/movies.ts
 * Later: GET ${NEXT_PUBLIC_API_URL}/movies and GET /movies/:id
 */

export async function getMovies(): Promise<Movie[]> {
  if (useRemoteApi()) {
    const response = await apiFetch("/movies");
    if (!response.ok) throw new Error("Could not load movies.");
    return response.json() as Promise<Movie[]>;
  }
  return movies;
}

export async function getMovie(id: string): Promise<Movie | null> {
  if (useRemoteApi()) {
    const response = await apiFetch(`/movies/${id}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Could not load this movie.");
    return response.json() as Promise<Movie>;
  }
  return movies.find((movie) => movie.id === id) ?? null;
}

export async function getFeaturedMovies() {
  const catalog = await getMovies();
  return catalog.filter((movie) => movie.featured);
}

export async function getTrendingMovies() {
  const catalog = await getMovies();
  return catalog
    .filter((movie) => movie.trendingRank)
    .sort((a, b) => (a.trendingRank ?? 0) - (b.trendingRank ?? 0));
}

export function filterMovies(catalog: Movie[], filters: MovieFilters) {
  const query = filters.q.trim().toLowerCase();
  const matched = catalog.filter((movie) => {
    if (filters.genre && movie.genre !== filters.genre) return false;
    if (filters.country && movie.country !== filters.country) return false;
    if (filters.language && movie.language !== filters.language) return false;
    if (filters.year && String(movie.year) !== filters.year) return false;
    if (!query) return true;
    const haystack = [
      movie.title,
      movie.overview,
      movie.genre,
      movie.country,
      movie.language,
      movie.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  const sorted = [...matched];
  if (filters.sort === "newest") {
    sorted.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  } else if (filters.sort === "popular") {
    sorted.sort(
      (a, b) =>
        (a.trendingRank ?? 99) - (b.trendingRank ?? 99) || b.year - a.year,
    );
  } else {
    sorted.sort(
      (a, b) =>
        Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
        (a.trendingRank ?? 99) - (b.trendingRank ?? 99) ||
        a.title.localeCompare(b.title),
    );
  }
  return sorted;
}
