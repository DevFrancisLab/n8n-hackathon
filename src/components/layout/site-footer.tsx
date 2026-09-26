import { Link } from "react-router-dom";
import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-border">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-serif text-2xl">YakWetu</p>
          <p className="mt-2 max-w-md text-sm text-muted">
            Demo stories for a conversion engine. Browse, leave, and come back — each step is an event Django will send to n8n.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
          <Link to="/movies" className="text-muted hover:text-foreground">
            Movies
          </Link>
          <Link to="/concierge" className="text-muted hover:text-foreground">
            AI Concierge
          </Link>
          <Link to="/demo" className="text-muted hover:text-foreground">
            Demo journey
          </Link>
          <Link to="/login" className="text-muted hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
