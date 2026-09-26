import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(fieldClass, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-28 w-full rounded-md border border-border bg-surface px-3 py-3 text-sm text-foreground placeholder:text-muted",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(function Select(
  { className, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn(fieldClass, "pr-8", className)} {...props} />
  );
});
