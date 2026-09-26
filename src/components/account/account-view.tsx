"use client";

import { Link } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { LoadingState } from "@/components/layout/page-status";
import { MovieArtwork } from "@/components/movies/movie-artwork";
import { MovieCard } from "@/components/movies/movie-card";
import { Button } from "@/components/ui/button";
import { getPurchases } from "@/lib/api/checkout";
import { getProgressMap, getRecentViewIds, watchedMovieIds } from "@/lib/api/library";
import { getMovies } from "@/lib/api/movies";
import { useAuth } from "@/lib/auth-context";
import { recommendForCustomer } from "@/lib/recommendations";
import { getActiveCustomerId } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import type { Movie, Purchase, Recommendation } from "@/types";

export function AccountView() {
  const { user, ready, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Array<Purchase & { movie?: Movie }>>([]);
  const [continueWatching, setContinueWatching] = useState<Movie[]>([]);
  const [history, setHistory] = useState<Movie[]>([]);
  const [recent, setRecent] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    getMovies()
      .then((catalog) => {
        if (!active) return;
        const byId = new Map(catalog.map((movie) => [movie.id, movie]));
        const customerId = getActiveCustomerId();
        const owned = getPurchases().filter((purchase) => purchase.customerId === customerId);
        const progress = getProgressMap();
        const watched = new Set(watchedMovieIds(customerId));
        setPurchases(owned.map((purchase) => ({ ...purchase, movie: byId.get(purchase.movieId) })));
        setContinueWatching(
          Object.entries(progress)
            .filter(([, value]) => value > 3 && value < 100)
            .map(([movieId]) => byId.get(movieId))
            .filter((movie): movie is Movie => Boolean(movie))
            .filter((movie) => !watched.has(movie.id)),
        );
        setHistory(
          watchedMovieIds(customerId)
            .map((id) => byId.get(id))
            .filter((movie): movie is Movie => Boolean(movie)),
        );
        const viewedIds = getRecentViewIds();
        setRecent(
          viewedIds
            .map((id) => byId.get(id))
            .filter((movie): movie is Movie => Boolean(movie)),
        );
        setRecommendations(
          recommendForCustomer(catalog, {
            viewedIds,
            purchasedIds: owned.map((purchase) => purchase.movieId),
          }),
        );
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ready, user]);

  if (!ready || loading) return <LoadingState label="Loading your account..." />;

  return (
    <Container className="space-y-14 py-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Account</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl">{user?.name ?? "Your YakWetu"}</h1>
          <p className="mt-3 text-muted">
            {user ? user.email : "Not signed in"} · {user?.phone ?? "—"}
          </p>
          {!user ? (
            <p className="mt-3 max-w-xl text-sm text-muted">
              This browser still remembers what you watched. Create an account to keep purchases with you.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {user ? (
            <Button variant="secondary" onClick={() => void logout()}>
              Sign out
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link to="/signup?next=/account">Get Started</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/login?next=/account">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <section>
        <h2 className="font-serif text-3xl">Continue Watching</h2>
        {continueWatching.length === 0 ? (
          <EmptyCopy>Nothing in progress. Start a movie and come back to it.</EmptyCopy>
        ) : (
          <ul className="scroller mt-5 flex gap-4 overflow-x-auto pb-2">
            {continueWatching.map((movie) => (
              <li key={movie.id} className="w-[46%] shrink-0 sm:w-48">
                <Link to={`/watch/${movie.id}`} className="block">
                  <div className="aspect-[2/3] overflow-hidden border border-border">
                    <MovieArtwork movie={movie} />
                  </div>
                  <p className="mt-3 font-medium">{movie.title}</p>
                  <p className="mt-1 text-sm text-muted">Continue</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-3xl">Your Purchases</h2>
        {purchases.length === 0 ? (
          <EmptyCopy>No purchases yet. Buy a story and it will stay here.</EmptyCopy>
        ) : (
          <ul className="mt-5 divide-y divide-border border-y border-border">
            {purchases.map((purchase) => (
              <li key={purchase.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{purchase.movie?.title ?? "Movie"}</p>
                  <p className="text-sm text-muted">
                    {formatPrice(purchase.amount)} · {purchase.paymentMethod === "mpesa" ? "M-Pesa" : purchase.paymentMethod}
                  </p>
                </div>
                <Button asChild variant="secondary">
                  <Link to={`/watch/${purchase.movieId}`}>Watch</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-3xl">Watch history</h2>
        {history.length === 0 ? (
          <EmptyCopy>Movies you mark as watched will collect here.</EmptyCopy>
        ) : (
          <MovieList movies={history} />
        )}
      </section>

      <section>
        <h2 className="font-serif text-3xl">Recently viewed</h2>
        {recent.length === 0 ? (
          <EmptyCopy>Open a movie and it will show up here.</EmptyCopy>
        ) : (
          <MovieList movies={recent} />
        )}
      </section>

      <section>
        <h2 className="font-serif text-3xl">Recommended For You</h2>
        {recommendations.length === 0 ? (
          <EmptyCopy>Recommendations appear after you explore the library.</EmptyCopy>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recommendations.map((item) => (
              <li key={item.movie.id}>
                <MovieCard movie={item.movie} list="account" />
                <p className="mt-2 text-sm text-muted">{item.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}

function MovieList({ movies }: { movies: Movie[] }) {
  return (
    <ul className="scroller mt-5 flex gap-4 overflow-x-auto pb-2">
      {movies.map((movie) => (
        <li key={movie.id} className="w-[46%] shrink-0 sm:w-48">
          <MovieCard movie={movie} />
        </li>
      ))}
    </ul>
  );
}

function EmptyCopy({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-muted">{children}</p>;
}
