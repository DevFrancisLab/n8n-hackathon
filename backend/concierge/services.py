import re

from movies.models import Movie

EAST_AFRICA = ["Kenya", "Tanzania", "Uganda", "Rwanda", "Ethiopia"]
DIASPORA = ["United Kingdom", "Canada", "United States"]


def _includes_country(prompt, country):
    name = country.lower()
    if name in prompt:
        return True
    aliases = {
        "kenya": "kenyan",
        "nigeria": "nigerian",
        "ghana": "ghanaian",
        "south africa": "south african",
        "ethiopia": "ethiopian",
        "senegal": "senegalese",
    }
    alias = aliases.get(name)
    return bool(alias and alias in prompt)


def _reason(movie, prompt):
    if re.search(r"kenyan", prompt) and movie.country == "Kenya" and movie.genre == "Thriller":
        return "You seem interested in Kenyan thrillers with strong character-driven stories."
    if movie.country == "Kenya" and re.search(r"kenya|kenyan", prompt):
        return f"You seem interested in Kenyan stories. {movie.title} is a {movie.genre.lower()} from the demo library."
    if re.search(r"hidden gem|underrated", prompt):
        return f"{movie.title} sits outside the featured row — a {movie.country} {movie.genre.lower()} worth opening."
    if re.search(r"funny|comedy|laugh", prompt) and movie.genre == "Comedy":
        return f"You asked for something funny. {movie.title} is a {movie.country} comedy in the demo library."
    if re.search(r"family", prompt) and movie.genre == "Family":
        return f"You asked for a family night. {movie.title} is paced for a shared watch."
    if re.search(r"romance|love", prompt) and movie.genre == "Romance":
        return f"You asked for romance. {movie.title} is a {movie.country} love story."
    if re.search(r"intense|thriller|action", prompt):
        return f"You asked for something intense. {movie.title} is a {movie.country} {movie.genre.lower()}."
    if re.search(r"drama", prompt) and movie.genre == "Drama":
        return f"You asked for African drama. {movie.title} is a character-driven {movie.country} story."
    return f"This matches the mood you described: a {movie.country} {movie.genre.lower()} from the demo library."


def recommend_for_prompt(prompt):
    query = (prompt or "").strip().lower()
    if not query:
        return None
    catalog = list(Movie.objects.all())
    if not catalog:
        return None

    scored = []
    for movie in catalog:
        points = 0
        genre = movie.genre.lower()
        if genre in query:
            points += 5
        if re.search(r"funny|laugh|comedy", query) and movie.genre == "Comedy":
            points += 5
        if re.search(r"romance|love", query) and movie.genre == "Romance":
            points += 5
        if re.search(r"family|kids|children", query) and movie.genre == "Family":
            points += 5
        if re.search(r"documentary|real story", query) and movie.genre == "Documentary":
            points += 5
        if re.search(r"intense|dark|suspense", query) and movie.genre in {"Thriller", "Action"}:
            points += 4
        if re.search(r"thriller", query) and movie.genre == "Thriller":
            points += 2
        if _includes_country(query, movie.country):
            points += 4
        if re.search(r"east african", query) and movie.country in EAST_AFRICA:
            points += 3
        if re.search(r"diaspora", query) and movie.country in DIASPORA:
            points += 4
        if "african" in query:
            points += 1
        if re.search(r"hidden gem|underrated|surprise", query):
            points += -2 if movie.featured else 4
        for tag in movie.tags or []:
            if tag in query:
                points += 2
        if movie.title.lower() in query:
            points += 6
        scored.append((points, movie))

    scored.sort(key=lambda item: (-item[0], item[1].title))
    best_points, best = scored[0]
    if best_points <= 0:
        fallback = next((movie for movie in catalog if movie.genre == "Drama"), catalog[0])
        return {
            "movie_id": fallback.id,
            "reason": (
                f"Nothing in the demo library matched that exactly. {fallback.title} is a "
                f"{fallback.country} {fallback.genre.lower()} and a steady place to start."
            ),
        }
    return {"movie_id": best.id, "reason": _reason(best, query)}
