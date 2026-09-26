"use client";

import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Container } from "@/components/layout/container";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { GENRES } from "@/types";

const links = [
  { href: "/movies", label: "Movies" },
  { href: "/concierge", label: "AI Concierge" },
];

export function SiteHeader() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [genresOpen, setGenresOpen] = useState(false);
  const home = pathname === "/";
  const solid = !home || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setGenresOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors",
        solid ? "border-b border-border bg-background/90 backdrop-blur-md" : "bg-transparent",
      )}
    >
      <Container className="flex h-16 items-center gap-3">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="YakWetu home">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-accent/50 font-serif text-sm text-accent">
            Y
          </span>
          <span className="font-serif text-xl tracking-tight">YakWetu</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
          <NavLink to="/movies" current={pathname.startsWith("/movies")}>
            Movies
          </NavLink>
          <div className="relative">
            <button
              type="button"
              className="h-10 rounded-md px-3 text-sm text-foreground/90 hover:bg-elevated"
              aria-expanded={genresOpen}
              aria-haspopup="true"
              onClick={() => setGenresOpen((open) => !open)}
            >
              Genres
            </button>
            {genresOpen ? (
              <div
                role="menu"
                className="absolute left-0 top-full z-50 mt-2 w-48 border border-border bg-elevated p-1 shadow-xl"
              >
                {GENRES.map((genre) => (
                  <Link
                    key={genre}
                    role="menuitem"
                    to={`/movies?genre=${encodeURIComponent(genre)}`}
                    className="block rounded-sm px-3 py-2 text-sm hover:bg-surface"
                    onClick={() => setGenresOpen(false)}
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          {links.slice(1).map((link) => (
            <NavLink key={link.href} to={link.href} current={pathname.startsWith(link.href)}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form action="/movies" className="relative hidden lg:block">
            <label htmlFor="site-search" className="sr-only">
              Search movies
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="site-search"
              name="q"
              placeholder="Search"
              className="h-10 w-40 rounded-md border border-border bg-surface pr-3 pl-9 text-sm xl:w-56"
            />
          </form>
          <Link
            to="/movies"
            className="grid h-11 w-11 place-items-center rounded-md hover:bg-elevated lg:hidden"
            aria-label="Search movies"
          >
            <Search className="size-5" />
          </Link>
          {user ? (
            <Link
              to="/account"
              className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-elevated"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border border-border bg-elevated text-sm">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-sm lg:inline">{user.name.split(" ")[0]}</span>
            </Link>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="h-11 rounded-md px-3 text-sm leading-[2.75rem] hover:bg-elevated">
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-background hover:bg-accent-hover"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}

function NavLink({
  to,
  current,
  children,
}: {
  to: string;
  current: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      aria-current={current ? "page" : undefined}
      className={cn(
        "h-10 rounded-md px-3 text-sm leading-10",
        current ? "text-accent" : "text-foreground/90 hover:bg-elevated",
      )}
    >
      {children}
    </Link>
  );
}
