import type { Movie, Recommendation } from "@/types";

const EAST_AFRICA = ["Kenya", "Tanzania", "Uganda", "Rwanda", "Ethiopia"];
const DIASPORA = ["United Kingdom", "Canada", "United States"];

function includesCountry(prompt: string, country: string) {
  const q = prompt.toLowerCase();
  const name = country.toLowerCase();
  if (q.includes(name)) return true;
  if (name === "kenya" && q.includes("kenyan")) return true;
  if (name === "nigeria" && q.includes("nigerian")) return true;
  if (name === "ghana" && (q.includes("ghanaian") || q.includes("ghana"))) return true;
  if (name === "south africa" && q.includes("south african")) return true;
  if (name === "ethiopia" && q.includes("ethiopian")) return true;
  if (name === "senegal" && q.includes("senegalese")) return true;
  return false;
}

export function recommendForPrompt(prompt: string, catalog: Movie[]): Recommendation | null {
  const q = prompt.trim().toLowerCase();
  if (!q) return null;

  const scored = catalog.map((movie) => {
    let points = 0;
    const genre = movie.genre.toLowerCase();

    if (q.includes(genre)) points += 5;
    if (/funny|laugh|comedy/.test(q) && movie.genre === "Comedy") points += 5;
    if (/romance|love/.test(q) && movie.genre === "Romance") points += 5;
    if (/family|kids|children/.test(q) && movie.genre === "Family") points += 5;
    if (/documentary|real story/.test(q) && movie.genre === "Documentary") points += 5;
    if (/intense|dark|suspense/.test(q) && (movie.genre === "Thriller" || movie.genre === "Action")) {
      points += 4;
    }
    if (/thriller/.test(q) && movie.genre === "Thriller") points += 2;
    if (includesCountry(q, movie.country)) points += 4;
    if (/east african/.test(q) && EAST_AFRICA.includes(movie.country)) points += 3;
    if (/diaspora/.test(q) && DIASPORA.includes(movie.country)) points += 4;
    if (/african/.test(q)) points += 1;
    if (/hidden gem|underrated|surprise/.test(q)) {
      points += movie.featured ? -2 : 4;
    }
    for (const tag of movie.tags) {
      if (q.includes(tag)) points += 2;
    }
    if (q.includes(movie.title.toLowerCase())) points += 6;

    return { movie, points };
  });

  scored.sort(
    (a, b) => b.points - a.points || a.movie.title.localeCompare(b.movie.title),
  );
  const best = scored[0];
  if (!best || best.points <= 0) {
    const fallback = catalog.find((movie) => movie.genre === "Drama") ?? catalog[0];
    if (!fallback) return null;
    return {
      movie: fallback,
      reason: `Nothing in the demo library matched that exactly. ${fallback.title} is a ${fallback.country} ${fallback.genre.toLowerCase()} and a steady place to start.`,
    };
  }

  return { movie: best.movie, reason: reasonFor(best.movie, q) };
}

function reasonFor(movie: Movie, prompt: string) {
  if (/kenyan/.test(prompt) && movie.country === "Kenya" && movie.genre === "Thriller") {
    return "You seem interested in Kenyan thrillers with strong character-driven stories.";
  }
  if (movie.country === "Kenya" && /kenya|kenyan/.test(prompt)) {
    return `You seem interested in Kenyan stories. ${movie.title} is a ${movie.genre.toLowerCase()} from the demo library.`;
  }
  if (/hidden gem|underrated/.test(prompt)) {
    return `${movie.title} sits outside the featured row — a ${movie.country} ${movie.genre.toLowerCase()} worth opening.`;
  }
  if (/funny|comedy|laugh/.test(prompt) && movie.genre === "Comedy") {
    return `You asked for something funny. ${movie.title} is a ${movie.country} comedy in the demo library.`;
  }
  if (/family/.test(prompt) && movie.genre === "Family") {
    return `You asked for a family night. ${movie.title} is paced for a shared watch.`;
  }
  if (/romance|love/.test(prompt) && movie.genre === "Romance") {
    return `You asked for romance. ${movie.title} is a ${movie.country} love story.`;
  }
  if (/intense|thriller|action/.test(prompt)) {
    return `You asked for something intense. ${movie.title} is a ${movie.country} ${movie.genre.toLowerCase()}.`;
  }
  if (/drama/.test(prompt) && movie.genre === "Drama") {
    return `You asked for African drama. ${movie.title} is a character-driven ${movie.country} story.`;
  }
  return `This matches the mood you described: a ${movie.country} ${movie.genre.toLowerCase()} from the demo library.`;
}

export function moreLikeThis(movie: Movie, catalog: Movie[], limit = 6) {
  return catalog
    .filter((item) => item.id !== movie.id)
    .map((item) => ({
      item,
      score:
        (item.genre === movie.genre ? 3 : 0) +
        (item.country === movie.country ? 2 : 0) +
        (item.language === movie.language ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function whyYouMightLike(movie: Movie, recent: Movie[]) {
  const related = recent.find(
    (item) => item.id !== movie.id && (item.genre === movie.genre || item.country === movie.country),
  );
  if (related) {
    return `Recommended because you recently explored ${related.country} ${related.genre.toLowerCase()}s.`;
  }
  const tag =
    movie.tags.find((item) => item !== movie.country.toLowerCase() && item !== movie.genre.toLowerCase()) ??
    "story";
  return `A ${movie.country} ${movie.genre.toLowerCase()} from the demo library, chosen for its focus on ${tag}.`;
}

export function recommendForCustomer(
  catalog: Movie[],
  signals: { viewedIds: string[]; purchasedIds: string[] },
): Recommendation[] {
  const viewed = catalog.filter((movie) => signals.viewedIds.includes(movie.id));
  const genreCounts = new Map<string, number>();
  for (const movie of viewed) {
    genreCounts.set(movie.genre, (genreCounts.get(movie.genre) ?? 0) + 1);
  }
  const topGenre = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const owned = new Set(signals.purchasedIds);
  const seen = new Set(signals.viewedIds);

  return [...catalog]
    .filter((movie) => !owned.has(movie.id))
    .sort((a, b) => {
      const score = (movie: Movie) =>
        (movie.genre === topGenre ? 2 : 0) +
        (viewed.some((item) => item.country === movie.country) ? 1 : 0) -
        (seen.has(movie.id) ? 1 : 0);
      return score(b) - score(a) || a.title.localeCompare(b.title);
    })
    .slice(0, 4)
    .map((movie) => ({
      movie,
      reason: topGenre
        ? `Recommended because you recently explored ${topGenre.toLowerCase()}s.`
        : `A ${movie.country} ${movie.genre.toLowerCase()} from the demo library.`,
    }));
}
