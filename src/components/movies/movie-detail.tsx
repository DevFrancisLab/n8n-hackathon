"use client";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/container";
import { BrowseLink, LoadingState, PageStatus } from "@/components/layout/page-status";
import { MovieArtwork } from "@/components/movies/movie-artwork";
import { RecommendationRail } from "@/components/movies/recommendation-rail";
import { Button } from "@/components/ui/button";
import { getMovie, getMovies } from "@/lib/api/movies";
import { addMovieToCart, getCartIds } from "@/lib/api/checkout";
import { getRecentViewIds, rememberView } from "@/lib/api/library";
import { trackEvent } from "@/lib/events";
import { moreLikeThis, whyYouMightLike } from "@/lib/recommendations";
import { formatDuration, formatPrice } from "@/lib/utils";
import type { Movie } from "@/types";

export function MovieDetail({ id }: { id: string }) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [inCart, setInCart] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    Promise.all([getMovie(id), getMovies()])
      .then(([current, catalog]) => {
        if (!active) return;
        if (!current) {
          setStatus("missing");
          return;
        }
        const previousIds = getRecentViewIds().filter((viewId) => viewId !== current.id);
        const previous = catalog.filter((item) => previousIds.includes(item.id));
        setMovie(current);
        document.title = `${current.title} · YakWetu`;
        setSimilar(moreLikeThis(current, catalog));
        setReason(whyYouMightLike(current, previous));
        setInCart(getCartIds().includes(current.id));
        rememberView(current.id);
        trackEvent({ event: "MOVIE_VIEWED", movieId: current.id });
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (status === "loading") return <LoadingState label="Finding movies..." />;
  if (status === "error") {
    return (
      <PageStatus
        title="Something went wrong. Please try again."
        action={<Button onClick={() => window.location.reload()}>Try again</Button>}
      />
    );
  }
  if (status === "missing" || !movie) {
    return (
      <PageStatus
        title="This story is not in the demo library."
        body="Browse the catalog for another African story."
        action={<BrowseLink />}
      />
    );
  }

  return (
    <article>
      <section className="relative min-h-[52vh] overflow-hidden">
        <div className="absolute inset-0">
          <MovieArtwork movie={movie} variant="backdrop" showTitle={false} />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, #0B0B0F 0%, rgba(11,11,15,0.55) 42%, rgba(11,11,15,0.2) 100%)",
          }}
        />
        <Container className="relative flex min-h-[52vh] items-end pb-8 pt-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="aspect-[2/3] w-36 overflow-hidden border border-white/15 sm:w-52">
              <MovieArtwork movie={movie} />
            </div>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.18em] text-accent">Demo story</p>
              <h1 className="mt-2 font-serif text-4xl sm:text-6xl">{movie.title}</h1>
              <p className="mt-3 text-sm text-muted sm:text-base">
                {movie.year} · {movie.country} · {movie.language} · {movie.genre} ·{" "}
                {formatDuration(movie.duration)}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <p className="max-w-2xl text-lg leading-relaxed text-foreground/90">{movie.overview}</p>
          <p className="mt-8 font-serif text-4xl text-accent">{formatPrice(movie.price)}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to={`/checkout/${movie.id}`}>Buy & Watch</Link>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              disabled={inCart}
              onClick={() => {
                addMovieToCart(movie.id);
                setInCart(true);
                setNotice("Added to cart");
              }}
            >
              {inCart ? "Added to cart" : "Add to Cart"}
            </Button>
          </div>
          <p role="status" className="mt-3 text-sm text-muted">
            {notice}
          </p>
        </div>
        <aside className="border border-border bg-surface p-5">
          <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Why you might like this</h2>
          <p className="mt-4 text-lg leading-relaxed">{reason}</p>
        </aside>
      </Container>

      <Container className="pb-16">
        <RecommendationRail title="More like this" movies={similar} list="more_like_this" />
      </Container>
    </article>
  );
}
