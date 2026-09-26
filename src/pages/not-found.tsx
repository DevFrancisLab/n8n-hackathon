import { useEffect } from "react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "Page not found · YakWetu";
  }, []);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col justify-center px-4 py-20">
      <h1 className="font-serif text-4xl">This page is not in the library.</h1>
      <p className="mt-4 text-muted">The story or route you asked for is not part of this demo.</p>
      <Link
        to="/movies"
        className="mt-8 inline-flex h-11 w-fit items-center rounded-md bg-accent px-5 text-sm font-medium text-background"
      >
        Browse Movies
      </Link>
    </div>
  );
}
