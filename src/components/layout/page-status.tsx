import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export function LoadingState({ label }: { label: string }) {
  return (
    <p role="status" aria-live="polite" className="px-4 py-16 text-muted sm:px-6">
      {label}
    </p>
  );
}

export function PageStatus({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-serif text-4xl text-foreground">{title}</h1>
      {body ? <p className="mt-4 text-muted">{body}</p> : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}

export function BrowseLink() {
  return (
    <Link
      to="/movies"
      className="inline-flex h-11 items-center rounded-md bg-accent px-5 text-sm font-medium text-background hover:bg-accent-hover"
    >
      Browse Movies
    </Link>
  );
}
