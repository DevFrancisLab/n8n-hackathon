"use client";

import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/events";
import { formatPrice } from "@/lib/utils";
import type { Movie } from "@/types";
import { MovieArtwork } from "./movie-artwork";

export function MovieCard({
  movie,
  rank,
  list,
}: {
  movie: Movie;
  rank?: number;
  list?: string;
}) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      onClick={() => {
        if (!list) return;
        trackEvent({
          event: "RECOMMENDATION_CLICKED",
          movieId: movie.id,
          metadata: { list },
        });
      }}
      className="group block"
    >
      <div className="relative aspect-[2/3] overflow-hidden border border-border bg-surface transition duration-300 group-hover:border-accent/50">
        {rank ? (
          <span
            aria-label={`Trending number ${rank}`}
            className="absolute left-2 top-1 z-10 font-serif text-3xl text-white"
          >
            {rank}
          </span>
        ) : null}
        <div className="h-full w-full transition duration-500 group-hover:scale-[1.04]">
          <MovieArtwork movie={movie} />
        </div>
      </div>
      <h3 className="mt-3 line-clamp-2 min-h-12 font-medium leading-snug">{movie.title}</h3>
      <p className="mt-1 text-sm text-muted">
        {movie.year} · {movie.genre} · {movie.country}
      </p>
      <p className="mt-1 text-sm text-accent">{formatPrice(movie.price)}</p>
      <p className="mt-2 text-sm text-foreground/80">View Movie</p>
    </Link>
  );
}
