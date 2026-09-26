import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/layout/container";
import { LoadingState } from "@/components/layout/page-status";
import { MovieArtwork } from "@/components/movies/movie-artwork";
import { MovieRow } from "@/components/movies/movie-row";
import { Button } from "@/components/ui/button";
import { getFeaturedMovies, getMovies, getTrendingMovies } from "@/lib/api/movies";
import { GENRES, type Movie } from "@/types";

export function HomePage() {
  const [featured, setFeatured] = useState<Movie[]>([]);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [catalog, setCatalog] = useState<Movie[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getFeaturedMovies(), getTrendingMovies(), getMovies()])
      .then(([featuredMovies, trendingMovies, allMovies]) => {
        if (!active) return;
        setFeatured(featuredMovies);
        setTrending(trendingMovies);
        setCatalog(allMovies);
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return <LoadingState label="Finding movies..." />;

  const hero = featured[0] ?? catalog[0];
  const side = featured.slice(1, 3);

  return (
    <div>
      {hero ? (
        <section className="relative -mt-16 min-h-[78vh] overflow-hidden pt-16 md:min-h-[88vh]">
          <div className="absolute inset-0">
            <MovieArtwork movie={hero} variant="backdrop" showTitle={false} />
          </div>
          <div
            className="absolute inset-0 md:hidden"
            style={{
              background:
                "linear-gradient(to top, #0B0B0F 0%, rgba(11,11,15,0.78) 46%, rgba(11,11,15,0.25) 100%)",
            }}
          />
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              background:
                "linear-gradient(to right, #0B0B0F 0%, rgba(11,11,15,0.8) 45%, rgba(11,11,15,0.25) 100%)",
            }}
          />
          <Container className="relative flex min-h-[78vh] items-end pb-12 md:min-h-[88vh] md:items-center md:pb-0">
            <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="max-w-xl">
                <p className="text-xs uppercase tracking-[0.22em] text-accent">YakWetu</p>
                <h1 className="mt-4 font-serif text-5xl leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
                  African stories. Your next movie.
                </h1>
                <p className="mt-5 max-w-md text-base text-muted sm:text-lg">
                  Discover powerful stories from Kenya and across Africa. Watch what speaks to you.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg">
                    <Link to="/movies">Explore Movies</Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                    <Link to="/concierge">Meet Your AI Concierge</Link>
                  </Button>
                </div>
                <p className="mt-6 text-sm text-muted">Featuring demo story: {hero.title}</p>
              </div>
              <div className="hidden gap-4 lg:flex">
                {side.map((movie) => (
                  <Link
                    key={movie.id}
                    to={`/movies/${movie.id}`}
                    className="block aspect-[2/3] w-36 overflow-hidden border border-white/10 xl:w-44"
                  >
                    <MovieArtwork movie={movie} />
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      <Container className="space-y-16 py-14 md:space-y-20 md:py-20">
        <MovieRow title="Featured Movies" movies={featured} />
        <MovieRow title="Trending" movies={trending} ranked />
        <p className="max-w-2xl text-muted">
          Every browse, checkout, and return is an event. The concierge turns that intent into a finished purchase.{" "}
          <Link to="/demo" className="text-foreground underline decoration-accent/80 underline-offset-4">
            See the conversion engine
          </Link>
        </p>
        <section>
          <h2 className="font-serif text-3xl sm:text-4xl">Explore by Genre</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {GENRES.map((genre) => {
              const count = catalog.filter((movie) => movie.genre === genre).length;
              return (
                <li key={genre}>
                  <Link
                    to={`/movies?genre=${encodeURIComponent(genre)}`}
                    className="flex min-h-28 flex-col justify-between border border-border bg-surface p-4 transition hover:border-accent/60"
                  >
                    <span className="font-serif text-2xl">{genre}</span>
                    <span className="text-sm text-muted">
                      {count} {count === 1 ? "story" : "stories"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="border border-border bg-surface px-6 py-10 md:px-10 md:py-14">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">AI Concierge</p>
          <h2 className="mt-3 max-w-xl font-serif text-4xl sm:text-5xl">Not sure what to watch?</h2>
          <p className="mt-4 max-w-xl text-muted">
            Tell YakWetu what you&apos;re in the mood for and get a personalized recommendation.
          </p>
          <Button asChild className="mt-8">
            <Link to="/concierge">Ask the AI Concierge</Link>
          </Button>
        </section>
        <section className="py-6 text-center md:py-10">
          <h2 className="font-serif text-4xl sm:text-6xl">Find your next African story.</h2>
          <Button asChild size="lg" className="mt-8">
            <Link to="/movies">Browse Movies</Link>
          </Button>
        </section>
      </Container>
    </div>
  );
}
