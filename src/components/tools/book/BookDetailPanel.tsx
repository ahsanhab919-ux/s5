"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Download, BookOpen } from "lucide-react";
import { setShowLoginModal } from "@/redux/slices/auth";
import ToolPageShell from "@/components/shared/ToolPageShell";
import BookRunPanel from "./BookRunPanel";
import ChapterList from "./ChapterList";
import StatusBadge from "./StatusBadge";
import type { Book, Chapter, ByokProvider } from "./types";

/**
 * BookDetailPanel — one book's surface: metadata, run/monitor/reset, the accepted
 * chapters (each regeneratable), and export.
 *
 * Owns the book + chapters snapshot (GET /api/book/[id]) and the book's live status
 * (mutated by BookRunPanel via onStatusChange as a run progresses). The chosen BYOK
 * provider is held here so both Run and per-chapter Regenerate use the same one.
 * Mirrors SecondMeProfilePanel's loading/401/error shape.
 */
export default function BookDetailPanel({ bookId }: { bookId: string }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [provider, setProvider] = useState<ByokProvider>("openai");
  const [status, setStatus] = useState<{ type: "error"; msg: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/book/${bookId}`, { credentials: "include" });
      if (res.status === 401) {
        dispatch(setShowLoginModal(true));
        return;
      }
      if (res.status === 404) {
        setStatus({ type: "error", msg: "Book not found." });
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setBook(data.book ?? null);
      setChapters(Array.isArray(data.chapters) ? data.chapters : []);
    } catch {
      setStatus({ type: "error", msg: "Could not load this book." });
    } finally {
      setLoading(false);
    }
  }, [bookId, dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  // Reload only the accepted chapters (after a run completes or a regenerate).
  const reloadChapters = useCallback(async () => {
    try {
      const res = await fetch(`/api/book/${bookId}`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setChapters(Array.isArray(data.chapters) ? data.chapters : []);
    } catch {
      /* keep the current chapters on a transient failure */
    }
  }, [bookId]);

  const onStatusChange = useCallback((next: Book["status"]) => {
    setBook((prev) => (prev ? { ...prev, status: next } : prev));
  }, []);

  const exportMarkdown = useCallback(async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch(`/api/book/${bookId}/export`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setExportError(data.error || `Could not export (${res.status}).`);
        return;
      }
      const data = await res.json();
      const blob = new Blob([data.markdown ?? ""], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || "book.md";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Could not export this book.");
    } finally {
      setExporting(false);
    }
  }, [bookId]);

  return (
    <ToolPageShell maxWidth="7xl" loading={loading} error={status?.msg ?? null}>
      {book && (
      <div className="space-y-5">
      <Link href="/book" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to books
      </Link>

      <div className="rounded-md border p-4 space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-base font-medium">{book.title}</span>
          <StatusBadge status={book.status} />
        </div>
        {book.subtitle && <div className="text-sm text-muted-foreground">{book.subtitle}</div>}
        <div className="text-[11px] text-muted-foreground">
          {book.author ? `${book.author} · ` : ""}
          {book.plan?.length ?? 0} planned chapter{(book.plan?.length ?? 0) === 1 ? "" : "s"} · {book.kind}
        </div>
      </div>

      <BookRunPanel
        bookId={bookId}
        status={book.status}
        provider={provider}
        onProviderChange={setProvider}
        onStatusChange={onStatusChange}
        onChaptersMaybeChanged={reloadChapters}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Chapters</span>
          <Button variant="outline" size="sm" onClick={exportMarkdown} disabled={exporting || chapters.length === 0}>
            {exporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 mr-2" />
                Export .md
              </>
            )}
          </Button>
        </div>
        {exportError && (
          <p className="text-xs text-destructive" role="status">
            {exportError}
          </p>
        )}
        <ChapterList
          bookId={bookId}
          chapters={chapters}
          provider={provider}
          disabled={book.status === "authoring"}
          onRegenerated={reloadChapters}
        />
      </div>
      </div>
      )}
    </ToolPageShell>
  );
}
