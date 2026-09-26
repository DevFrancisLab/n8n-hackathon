"use client";

import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/layout/container";
import { LoadingState, PageStatus } from "@/components/layout/page-status";
import { MovieCard } from "@/components/movies/movie-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { filterMovies, getMovies } from "@/lib/api/movies";
import { trackEvent } from "@/lib/events";
import { uniqueSorted } from "@/lib/utils";
import { GENRES, type Movie, type MovieFilters } from "@/types";

export function MoviesBrowser() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<Movie[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState(params.get("q") ?? "");

  const filters = useMemo<MovieFilters>(
    () => ({
      q: params.get("q") ?? "",
      genre: params.get("genre") ?? "",
      country: params.get("country") ?? "",
      language: params.get("language") ?? "",
      year: params.get("year") ?? "",
      sort: (params.get("sort") as MovieFilters["sort"]) || "featured",
    }),
    [params],
  );

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

  useEffect(() => {
    let active = true;
    getMovies()
      .then((movies) => {
        if (!active) return;
        setCatalog(movies);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (query === current) return;
    const handle = window.setTimeout(() => {
      updateQuery(query);
      if (query.trim()) {
        trackEvent({
          event: "SEARCH_PERFORMED",
          metadata: { query: query.trim() },
        });
      }
    }, 400);
    return () => window.clearTimeout(handle);
    // updateQuery closes over the latest filters via params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function replaceFilters(next: Partial<MovieFilters>) {
    const merged = { ...filters, ...next };
    const search = new URLSearchParams();
    if (merged.q) search.set("q", merged.q);
    if (merged.genre) search.set("genre", merged.genre);
    if (merged.country) search.set("country", merged.country);
    if (merged.language) search.set("language", merged.language);
    if (merged.year) search.set("year", merged.year);
    if (merged.sort && merged.sort !== "featured") search.set("sort", merged.sort);
    const qs = search.toString();
    navigate(qs ? `/movies?${qs}` : "/movies", { replace: true });
  }

  function updateQuery(value: string) {
    replaceFilters({ q: value });
  }

  const results = filterMovies(catalog, { ...filters, q: query });
  const countries = uniqueSorted(catalog.map((movie) => movie.country));
  const languages = uniqueSorted(catalog.map((movie) => movie.language));
  const years = uniqueSorted(catalog.map((movie) => String(movie.year))).reverse();

  return (
    <Container className="py-8 md:py-12">
      <h1 className="font-serif text-4xl sm:text-5xl">Explore Movies</h1>
      <p className="mt-3 text-sm text-muted">Demo titles created for this prototype.</p>

      <div className="mt-8 space-y-4">
        <div>
          <Label htmlFor="movie-search" className="sr-only">
            Search movies, stories, genres
          </Label>
          <Input
            id="movie-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search movies, stories, genres..."
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Filter
            id="genre"
            label="Genre"
            value={filters.genre}
            onChange={(genre) => replaceFilters({ genre })}
            options={GENRES.map((genre) => ({ value: genre, label: genre }))}
            allLabel="All genres"
          />
          <Filter
            id="country"
            label="Country"
            value={filters.country}
            onChange={(country) => replaceFilters({ country })}
            options={countries.map((country) => ({ value: country, label: country }))}
            allLabel="All countries"
          />
          <Filter
            id="language"
            label="Language"
            value={filters.language}
            onChange={(language) => replaceFilters({ language })}
            options={languages.map((language) => ({ value: language, label: language }))}
            allLabel="All languages"
          />
          <Filter
            id="year"
            label="Year"
            value={filters.year}
            onChange={(year) => replaceFilters({ year })}
            options={years.map((year) => ({ value: year, label: year }))}
            allLabel="All years"
          />
          <Filter
            id="sort"
            label="Sort"
            value={filters.sort}
            onChange={(sort) => replaceFilters({ sort: sort as MovieFilters["sort"] })}
            options={[
              { value: "featured", label: "Featured" },
              { value: "newest", label: "Newest" },
              { value: "popular", label: "Popular" },
            ]}
            includeAll={false}
          />
        </div>
      </div>

      {status === "loading" ? <LoadingState label="Finding movies..." /> : null}
      {status === "error" ? (
        <PageStatus
          title="Something went wrong. Please try again."
          action={<Button onClick={() => window.location.reload()}>Try again</Button>}
        />
      ) : null}
      {status === "ready" && results.length === 0 ? (
        <div className="py-16">
          <h2 className="font-serif text-3xl">No movies found.</h2>
          <p className="mt-3 text-muted">Try another title, country, or genre.</p>
          <Button
            className="mt-6"
            variant="secondary"
            onClick={() => {
              setQuery("");
              navigate("/movies", { replace: true });
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : null}
      {status === "ready" && results.length > 0 ? (
        <>
          <p className="mt-8 text-sm text-muted">
            {results.length} {results.length === 1 ? "story" : "stories"}
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((movie) => (
              <li key={movie.id}>
                <MovieCard movie={movie} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Container>
  );
}

function Filter({
  id,
  label,
  value,
  onChange,
  options,
  allLabel = "All",
  includeAll = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
  includeAll?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {includeAll ? <option value="">{allLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
