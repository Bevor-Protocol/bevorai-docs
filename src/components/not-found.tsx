import Link from "fumadocs-core/link";
import { HomeIcon } from "lucide-react";

export const NotFound = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
    <h1 className="text-6xl font-bold text-fd-muted-foreground">404</h1>
    <h2 className="text-2xl font-semibold">Page not found</h2>
    <p className="max-w-md text-fd-muted-foreground">
      The page you are looking for might have been removed, had its name changed, or is
      temporarily unavailable.
    </p>
    <Link
      href="/docs"
      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/80"
    >
      <HomeIcon className="size-4" />
      Back to docs
    </Link>
  </div>
);
