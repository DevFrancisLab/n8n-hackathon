"use client";

import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const cinematic = pathname.startsWith("/watch");

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main
        id="main"
        tabIndex={-1}
        className={cn("flex-1 pt-16 outline-none", cinematic ? "pb-0" : "pb-20 md:pb-0")}
      >
        {children}
      </main>
      <div className={cinematic ? "" : "pb-20 md:pb-0"}>
        <SiteFooter />
      </div>
      <MobileNav />
    </>
  );
}
