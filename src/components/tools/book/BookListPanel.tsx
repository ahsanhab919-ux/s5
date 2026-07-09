"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { Loader2, BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { setShowLoginModal } from "@/redux/slices/auth";
import ToolPageShell from "@/components/shared/ToolPageShell";
import CreateBookForm from "./CreateBookForm";
import StatusBadge from "./StatusBadge";
import type { Book } from "./types";

/**
 * BookListPanel — the /book landing surface: create a book + list the user's
 * books. Self-contained client component talking to /api/book with plain fetch
 * (no shared API helper, per project convention). Mirrors SecondMeProfilePanel's
 * loading/error/401 handling.
 */
export default function BookListPanel() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [status, setStatus] = useState<{ type: "error"; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/book", { credentials: "include" });
      if (res.status === 401) {
        dispatch(setShowLoginModal(true));
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setBooks(Array.isArray(data.books) ? data.books : []);
    } catch {
      setStatus({ type: "error", msg: "Could not load your books." });
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const onCreated = useCallback((book: Book) => {
    setBooks((prev) => [book, ...prev]);
  }, []);

  return (
    <ToolPageShell maxWidth="7xl">
      <div className="space-y-5">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Book authoring</span>
      </div>

      <CreateBookForm onCreated={onCreated} />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your books…
        </div>
      ) : status ? (
        <p className="text-sm text-destructive" role="status">
          {status.msg}
        </p>
      ) : books.length === 0 ? (
        <p className="text-sm text-muted-foreground p-4">
          No books yet. Create one above to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {books.map((b) => (
            <Link
              key={b._id}
              href={`/book/${b._id}`}
              className={cn(
                "flex items-center justify-between rounded-md border p-3 transition-colors",
                "hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{b.title}</span>
                  <StatusBadge status={b.status} />
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {b.plan?.length ?? 0} chapter{(b.plan?.length ?? 0) === 1 ? "" : "s"} · {b.kind}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
      </div>
    </ToolPageShell>
  );
}
