import type { Movie } from "@/types";
import { cn } from "@/lib/utils";

export function MovieArtwork({
  movie,
  variant = "poster",
  showTitle = true,
  className,
}: {
  movie: Movie;
  variant?: "poster" | "backdrop";
  showTitle?: boolean;
  className?: string;
}) {
  const src = variant === "poster" ? movie.poster : movie.backdrop;
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return (
      // Remote art is reserved for a later TMDB ingest. Demo records use generated artwork.
      <img
        src={src}
        alt={`${movie.title} ${variant}`}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${movie.title}, demo ${variant}`}
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{
        background: `linear-gradient(165deg, ${movie.palette.from} 0%, ${movie.palette.to} 78%)`,
      }}
    >
      <Motif motif={movie.motif} accent={movie.palette.accent} />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
      {showTitle ? (
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">{movie.country}</p>
          <p
            className={cn(
              "mt-1 font-serif leading-tight text-white",
              variant === "backdrop" ? "max-w-xl text-3xl sm:text-5xl" : "text-lg sm:text-2xl",
            )}
          >
            {movie.title}
          </p>
        </div>
      ) : null}
      <span className="absolute right-2 top-2 bg-black/45 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/80">
        Demo
      </span>
    </div>
  );
}

function Motif({ motif, accent }: { motif: Movie["motif"]; accent: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {motif === 0 ? (
        <>
          <circle cx="78" cy="18" r="22" fill={accent} fillOpacity="0.35" />
          <rect x="10" y="22" width="14" height="48" fill="white" fillOpacity="0.08" />
          <rect x="28" y="34" width="8" height="36" fill="white" fillOpacity="0.06" />
        </>
      ) : null}
      {motif === 1 ? (
        <>
          <circle cx="18" cy="82" r="28" fill={accent} fillOpacity="0.28" />
          <path d="M0 22 H100" stroke="white" strokeOpacity="0.16" strokeWidth="1.5" />
          <path d="M0 30 H68" stroke={accent} strokeOpacity="0.9" strokeWidth="2.5" />
        </>
      ) : null}
      {motif === 2 ? (
        <>
          <polygon points="68,0 100,0 100,42" fill={accent} fillOpacity="0.38" />
          <circle cx="32" cy="40" r="16" fill="none" stroke="white" strokeOpacity="0.28" strokeWidth="1.2" />
        </>
      ) : null}
      {motif === 3 ? (
        <>
          <rect x="0" y="64" width="100" height="8" fill={accent} fillOpacity="0.5" />
          <circle cx="50" cy="30" r="16" fill="white" fillOpacity="0.07" />
        </>
      ) : null}
    </svg>
  );
}
