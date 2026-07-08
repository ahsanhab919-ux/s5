"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BookStatus } from "./types";

/** A small colored badge for a book's lifecycle status. */
export default function StatusBadge({ status }: { status: BookStatus }) {
  const styles: Record<BookStatus, string> = {
    draft: "border-muted-foreground/40 text-muted-foreground",
    authoring: "border-amber-500/40 text-amber-600 dark:text-amber-400",
    complete: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
    failed: "border-destructive/40 text-destructive",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] capitalize", styles[status])}>
      {status}
    </Badge>
  );
}
