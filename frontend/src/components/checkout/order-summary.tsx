import type { Movie } from "@/types";
import { formatPrice } from "@/lib/utils";
import { MovieArtwork } from "@/components/movies/movie-artwork";

export function OrderSummary({ movie }: { movie: Movie }) {
  return (
    <section className="border border-border bg-surface p-5" aria-label="Order summary">
      <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Order summary</h2>
      <div className="mt-4 flex gap-4">
        <div className="aspect-[2/3] w-16 shrink-0 overflow-hidden">
          <MovieArtwork movie={movie} showTitle={false} />
        </div>
        <div>
          <p className="font-medium">{movie.title}</p>
          <p className="mt-1 text-sm text-muted">
            {movie.year} · {movie.genre}
          </p>
        </div>
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Movie</dt>
          <dd>{formatPrice(movie.price)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border pt-3 text-base">
          <dt>Total</dt>
          <dd className="text-accent">{formatPrice(movie.price)}</dd>
        </div>
      </dl>
    </section>
  );
}
