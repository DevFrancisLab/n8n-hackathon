"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/events";
import type { Movie } from "@/types";
import { MovieCard } from "./movie-card";

export function RecommendationRail({
  title,
  movies,
  list,
}: {
  title: string;
  movies: Movie[];
  list: string;
}) {
  const ids = movies.map((movie) => movie.id).join(",");

  useEffect(() => {
    if (!ids) return;
    trackEvent({
      event: "RECOMMENDATION_VIEWED",
      metadata: { list, movie_ids: ids },
    });
  }, [ids, list]);

  if (movies.length === 0) return null;

  return (
    <section>
      <h2 className="font-serif text-3xl sm:text-4xl">{title}</h2>
      <div className="scroller mt-5 flex gap-4 overflow-x-auto pb-2">
        {movies.map((movie) => (
          <div key={movie.id} className="w-[46%] shrink-0 sm:w-52">
            <MovieCard movie={movie} list={list} />
          </div>
        ))}
      </div>
    </section>
  );
}
