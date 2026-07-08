"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Play, RotateCcw } from "lucide-react";
import StatusBadge from "./StatusBadge";
import {
  BYOK_PROVIDERS,
  isTerminalStatus,
  type BookStatus,
  type ByokProvider,
  type RunProgress,
} from "./types";

const POLL_INTERVAL_MS = 4000;

/**
 * BookRunPanel — start a run, monitor its per-chapter progress, and reset.
 *
 * Run (POST /run) is valid only from `draft`; it returns 202 and authors in the
 * background, so this panel POLLS GET /status while the book is `authoring` and
 * renders the compact per-index rollup. Reset (POST /reset) re-arms a
 * finished/failed/stuck book back to draft (with a confirm).
 *
 * Polling lifecycle (leak-free):
 *  - The interval is created in an effect keyed on the current status; it only runs
 *    while status === 'authoring'.
 *  - It does one immediate poll, then every POLL_INTERVAL_MS.
 *  - When a poll observes a TERMINAL status (complete/failed) it lifts that status
 *    up (which re-runs the effect and tears the interval down) and asks the parent
 *    to reload chapters.
 *  - The effect's cleanup clears the interval on unmount AND on every status
 *    change, so no timer outlives the authoring state.
 */
export default function BookRunPanel({
  bookId,
  status,
  provider,
  onProviderChange,
  onStatusChange,
  onChaptersMaybeChanged,
}: {
  bookId: string;
  status: BookStatus;
  provider: ByokProvider;
  onProviderChange: (p: ByokProvider) => void;
  onStatusChange: (s: BookStatus) => void;
  onChaptersMaybeChanged: () => void;
}) {
  const [progress, setProgress] = useState<RunProgress | null>(null);
  const [starting, setStarting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Latest callbacks in refs so the polling effect can depend only on
  // [bookId, status] without re-subscribing when the parent re-renders.
  const onStatusChangeRef = useRef(onStatusChange);
  const onChaptersRef = useRef(onChaptersMaybeChanged);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onChaptersRef.current = onChaptersMaybeChanged;
  }, [onStatusChange, onChaptersMaybeChanged]);

  useEffect(() => {
    if (status !== "authoring") return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/book/${bookId}/status`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.progress) setProgress(data.progress);
        const next: BookStatus = data.status;
        if (next && next !== "authoring") {
          onStatusChangeRef.current(next);
          if (isTerminalStatus(next)) onChaptersRef.current();
        }
      } catch {
        /* transient poll failure — try again on the next tick */
      }
    };

    poll(); // immediate, so progress shows without waiting a full interval
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [bookId, status]);

  const run = useCallback(async () => {
    setStarting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/book/${bookId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider }),
      });
      if (res.status === 202) {
        setProgress(null);
        onStatusChange("authoring"); // starts the polling effect
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setActionError("Please sign in to run this book.");
        return;
      }
      // 400 covers "not draft" (reset first) and "no BYOK key" (store one).
      setActionError(data.error || `Could not start the run (${res.status}).`);
    } catch {
      setActionError("Could not start the run.");
    } finally {
      setStarting(false);
    }
  }, [bookId, provider, onStatusChange]);

  const reset = useCallback(async () => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Reset this book to draft? This deletes its authored chapters so it can be re-run from scratch.",
      );
      if (!ok) return;
    }
    setResetting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/book/${bookId}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || `Could not reset (${res.status}).`);
        return;
      }
      setProgress(null);
      onStatusChange("draft");
      onChaptersMaybeChanged();
    } catch {
      setActionError("Could not reset this book.");
    } finally {
      setResetting(false);
    }
  }, [bookId, onStatusChange, onChaptersMaybeChanged]);

  const authoring = status === "authoring";

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Run</span>
          <StatusBadge status={status} />
        </div>
        <select
          aria-label="Model provider"
          value={provider}
          disabled={authoring || starting}
          onChange={(e) => onProviderChange(e.target.value as ByokProvider)}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        >
          {BYOK_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={run} disabled={status !== "draft" || starting}>
          {starting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Starting…
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run
            </>
          )}
        </Button>
        <Button variant="outline" onClick={reset} disabled={status === "draft" || resetting}>
          {resetting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Resetting…
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </>
          )}
        </Button>
      </div>

      {authoring && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Authoring… polling for progress.
        </div>
      )}

      {progress && (
        <div className="space-y-2">
          <div className="text-[11px] text-muted-foreground">
            {progress.accepted}/{progress.total} accepted
            {progress.failed > 0 ? ` · ${progress.failed} failed` : ""}
            {progress.lastIndex !== null ? ` · last chapter ${progress.lastIndex + 1}` : ""}
          </div>
          {progress.perIndex.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {progress.perIndex.map((p) => (
                <span
                  key={p.index}
                  title={`Chapter ${p.index + 1}: ${p.status} (try ${p.attempt})`}
                  className={cn(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded px-1 text-[10px] font-medium",
                    p.status === "accepted"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/15 text-destructive",
                  )}
                >
                  {p.index + 1}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {actionError && (
        <p className="text-sm text-destructive" role="status">
          {actionError}
        </p>
      )}
    </div>
  );
}
