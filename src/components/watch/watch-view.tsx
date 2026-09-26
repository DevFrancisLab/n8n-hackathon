"use client";

import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/container";
import { BrowseLink, LoadingState, PageStatus } from "@/components/layout/page-status";
import { MovieArtwork } from "@/components/movies/movie-artwork";
import { RecommendationRail } from "@/components/movies/recommendation-rail";
import { Button } from "@/components/ui/button";
import { getPurchases } from "@/lib/api/checkout";
import { getProgress, hasWatched, saveProgress } from "@/lib/api/library";
import { getMovie, getMovies } from "@/lib/api/movies";
import { trackEvent } from "@/lib/events";
import { moreLikeThis } from "@/lib/recommendations";
import { getActiveCustomerId } from "@/lib/storage";
import { formatClock } from "@/lib/utils";
import type { Movie } from "@/types";

export function WatchView({ movieId }: { movieId: string }) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [related, setRelated] = useState<Movie[]>([]);
  const [owned, setOwned] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    let active = true;
    Promise.all([getMovie(movieId), getMovies()])
      .then(([current, catalog]) => {
        if (!active) return;
        if (!current) {
          setStatus("missing");
          return;
        }
        const customerId = getActiveCustomerId();
        setMovie(current);
        document.title = `Watch ${current.title} · YakWetu`;
        setRelated(moreLikeThis(current, catalog, 3));
        setOwned(getPurchases().some((purchase) => purchase.movieId === current.id && purchase.customerId === customerId));
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [movieId]);

  if (status === "loading") return <LoadingState label="Loading the player..." />;
  if (status === "error") {
    return (
      <PageStatus
        title="Something went wrong. Please try again."
        action={<Button onClick={() => window.location.reload()}>Try again</Button>}
      />
    );
  }
  if (!movie) {
    return <PageStatus title="This story is not in the demo library." action={<BrowseLink />} />;
  }

  return <Player movie={movie} related={related} owned={owned} />;
}

function Player({ movie, related, owned }: { movie: Movie; related: Movie[]; owned: boolean }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const recsRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    setProgress(getProgress(movie.id));
    setWatched(hasWatched(movie.id, getActiveCustomerId()));
  }, [movie.id]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(100, value + 0.45));
    }, 200);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (progress >= 100) setPlaying(false);
  }, [progress]);

  useEffect(() => {
    const timer = window.setTimeout(() => saveProgress(movie.id, progress), 400);
    return () => window.clearTimeout(timer);
  }, [movie.id, progress]);

  const elapsed = (movie.duration * 60 * progress) / 100;
  const total = movie.duration * 60;

  function toggleFullscreen() {
    const node = frameRef.current;
    if (!node) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void node.requestFullscreen();
    }
  }

  function markWatched() {
    trackEvent({
      event: "WATCH_COMPLETED",
      movieId: movie.id,
      metadata: { duration: movie.duration },
    });
    saveProgress(movie.id, 100);
    setProgress(100);
    setPlaying(false);
    setWatched(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    recsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <div>
      <div ref={frameRef} className="bg-black">
        <div className="relative aspect-video w-full overflow-hidden">
          <MovieArtwork movie={movie} variant="backdrop" showTitle={false} />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Demo player</p>
            <p className="mt-3 max-w-lg font-serif text-3xl text-white sm:text-5xl">{movie.title}</p>
            <p className="mt-3 text-sm text-white/75">
              {playing ? "Playing picture placeholder" : "Press play to move through the demo reel"}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 bg-surface px-4 py-3 sm:flex-row sm:items-center">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-md hover:bg-elevated"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>
          <span className="text-xs text-muted tabular-nums">
            {formatClock(elapsed)} / {formatClock(total)}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            aria-label="Playback position"
            onChange={(event) => setProgress(Number(event.target.value))}
            className="sm:flex-1"
          />
          <label className="flex items-center gap-2">
            <span className="sr-only">Volume</span>
            {volume === 0 ? <VolumeX className="size-4 text-muted" /> : <Volume2 className="size-4 text-muted" />}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              aria-label="Volume"
              onChange={(event) => setVolume(Number(event.target.value))}
              className="w-24"
            />
          </label>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-md hover:bg-elevated"
            aria-label="Fullscreen"
            onClick={toggleFullscreen}
          >
            <Maximize className="size-5" />
          </button>
        </div>
      </div>

      <Container className="py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl">{movie.title}</h1>
            <p className="mt-2 text-sm text-muted">
              {owned ? "Included with your purchase." : "Demo player. A successful payment records the purchase."}
            </p>
          </div>
          <Button size="lg" onClick={markWatched} disabled={watched}>
            {watched ? "Watched" : "Mark as Watched"}
          </Button>
        </div>
        <p role="status" className="sr-only">
          {watched ? "Marked as watched" : ""}
        </p>
      </Container>

      {watched ? (
        <div ref={recsRef} className="scroll-mt-24">
          <Container className="pb-16">
            <p className="mb-6 max-w-xl text-muted">Since you watched this, three more stories are ready.</p>
            <RecommendationRail title="Because you watched this..." movies={related} list="post_watch" />
          </Container>
        </div>
      ) : null}
    </div>
  );
}
