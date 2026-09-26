"use client";

import { Link, useLocation } from "react-router-dom";
import { Clapperboard, Home, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home, match: (path: string) => path === "/" },
  { href: "/movies", label: "Browse", icon: Clapperboard, match: (path: string) => path.startsWith("/movies") },
  { href: "/concierge", label: "Concierge", icon: Sparkles, match: (path: string) => path.startsWith("/concierge") },
  { href: "/account", label: "Account", icon: UserRound, match: (path: string) => path.startsWith("/account") },
];

export function MobileNav() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/watch")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-xs",
                  active ? "text-accent" : "text-muted",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
