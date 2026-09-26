import type { Movie } from "@/types";
import { MovieCard } from "./movie-card";

export function MovieRow({
  title,
  movies,
  ranked = false,
}: {
  title: string;
  movies: Movie[];
  ranked?: boolean;
}) {
  return (
    <section>
      <h2 className="font-serif text-3xl sm:text-4xl">{title}</h2>
      <div className="scroller mt-5 flex gap-4 overflow-x-auto pb-2">
        {movies.map((movie) => (
          <div key={movie.id} className="w-[46%] shrink-0 snap-start sm:w-52 md:w-56">
            <MovieCard movie={movie} rank={ranked ? movie.trendingRank : undefined} />
          </div>
        ))}
      </div>
    </section>
  );
}
