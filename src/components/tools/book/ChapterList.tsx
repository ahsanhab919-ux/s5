"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";
import type { Chapter, ByokProvider } from "./types";

/**
 * ChapterList — the accepted chapters of a book (from GET /api/book/[id]), each
 * with a targeted Regenerate action (POST /api/book/[id]/chapter/[index]/regenerate).
 * Regenerate confirms first, shows per-chapter pending/error inline, and calls the
 * parent's onRegenerated on success so the fresh chapter text is reloaded.
 *
 * Disabled while the book is authoring (a full run owns the chapters) — matches the
 * endpoint's 409 guard so the UI never invites a request the server will reject.
 */
export default function ChapterList({
  bookId,
  chapters,
  provider,
  disabled,
  onRegenerated,
}: {
  bookId: string;
  chapters: Chapter[];
  provider: ByokProvider;
  disabled: boolean;
  onRegenerated: () => void;
}) {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [error, setError] = useState<{ index: number; msg: string } | null>(null);

  const regenerate = useCallback(
    async (index: number) => {
      if (typeof window !== "undefined") {
        const ok = window.confirm(
          `Regenerate chapter ${index + 1}? This replaces its text with a fresh draft that must pass the done-gate.`,
        );
        if (!ok) return;
      }
      setPendingIndex(index);
      setError(null);
      try {
        const res = await fetch(`/api/book/${bookId}/chapter/${index}/regenerate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ provider }),
        });
        if (res.status === 401) {
          setError({ index, msg: "Please sign in to regenerate." });
          return;
        }
        if (res.status === 409) {
          setError({ index, msg: "Book is authoring; wait for the run to finish." });
          return;
        }
        if (res.status === 422) {
          setError({ index, msg: "The regenerated draft did not pass the done-gate. Prior text kept." });
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError({ index, msg: data.error || `Request failed (${res.status})` });
          return;
        }
        onRegenerated();
      } catch {
        setError({ index, msg: "Could not regenerate this chapter." });
      } finally {
        setPendingIndex(null);
      }
    },
    [bookId, provider, onRegenerated],
  );

  if (chapters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No accepted chapters yet. Run the book to author them.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {chapters.map((c) => {
        const pending = pendingIndex === c.index;
        return (
          <div key={c._id ?? c.index} className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  Chapter {c.index + 1}: {c.intent}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {c.attempts} attempt{c.attempts === 1 ? "" : "s"}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled || pending}
                onClick={() => regenerate(c.index)}
              >
                {pending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Regenerating…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
              {c.content}
            </p>
            {error && error.index === c.index && (
              <p className={cn("text-xs text-destructive")} role="status">
                {error.msg}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
