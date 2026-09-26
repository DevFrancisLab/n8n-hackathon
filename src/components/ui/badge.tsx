import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
