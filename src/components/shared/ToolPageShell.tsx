import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MaxWidth = "2xl" | "7xl" | "full";

const MAX_WIDTH: Record<MaxWidth, string> = {
  "2xl": "max-w-2xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

/**
 * ToolPageShell — the standard outer wrapper + loading/error/empty states for a
 * tool page. Dumb/presentational: no data fetching, no redux. Callers own their
 * state and pass it in so every tool renders these states the same way.
 */
export default function ToolPageShell({
  maxWidth = "7xl",
  loading = false,
  error = null,
  empty,
  children,
}: {
  maxWidth?: MaxWidth;
  loading?: boolean;
  error?: string | null;
  empty?: ReactNode;
  children?: ReactNode;
}) {
  let body: ReactNode;
  if (loading) {
    body = (
      <div
        className="flex items-center gap-2 p-4 text-sm text-muted-foreground"
        role="status"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  } else if (error) {
    body = (
      <p className="p-4 text-sm text-destructive" role="status">
        {error}
      </p>
    );
  } else if (empty !== undefined && empty !== null) {
    body = empty;
  } else {
    body = children;
  }

  return (
    <div className={cn("container mx-auto px-4 py-6", MAX_WIDTH[maxWidth])}>
      {body}
    </div>
  );
}
