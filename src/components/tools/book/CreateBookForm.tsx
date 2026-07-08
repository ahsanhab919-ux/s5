"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import type { Book } from "./types";

/**
 * CreateBookForm — POST /api/book to create a book from a title + source document
 * (an outline or partial manuscript). Mirrors SecondMeProfilePanel's fetch/error
 * shape: explicit 401/400 handling, inline status, plaintext-free of surprises.
 * On success it hands the created book back to the parent (which prepends it to
 * the list) and clears the form.
 */
export default function CreateBookForm({ onCreated }: { onCreated: (book: Book) => void }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [author, setAuthor] = useState("");
  const [document, setDocument] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "ok"; msg: string } | null>(null);

  const submit = useCallback(async () => {
    if (!title.trim()) {
      setStatus({ type: "error", msg: "A title is required." });
      return;
    }
    if (!document.trim()) {
      setStatus({ type: "error", msg: "Paste an outline or manuscript to ingest." });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          author: author.trim() || undefined,
          document,
        }),
      });
      if (res.status === 401) {
        setStatus({ type: "error", msg: "Please sign in to create a book." });
        return;
      }
      if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        setStatus({ type: "error", msg: data.error || "Invalid book." });
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (data.book) onCreated(data.book);
      setTitle("");
      setSubtitle("");
      setAuthor("");
      setDocument("");
      setStatus({ type: "ok", msg: "Book created." });
    } catch {
      setStatus({ type: "error", msg: "Could not create your book." });
    } finally {
      setBusy(false);
    }
  }, [title, subtitle, author, document, onCreated]);

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">New book</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <input
          type="text"
          aria-label="Title"
          value={title}
          disabled={busy}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (required)"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        />
        <input
          type="text"
          aria-label="Subtitle"
          value={subtitle}
          disabled={busy}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Subtitle"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        />
        <input
          type="text"
          aria-label="Author"
          value={author}
          disabled={busy}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        />
      </div>

      <textarea
        aria-label="Source document"
        value={document}
        disabled={busy}
        onChange={(e) => setDocument(e.target.value)}
        placeholder="Paste your outline or partial manuscript (markdown). Chapters are ingested from its structure."
        rows={6}
        className="w-full rounded-md border bg-background px-2 py-2 text-sm"
      />

      <Button onClick={submit} disabled={busy} className="w-full sm:w-auto">
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating…
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Create book
          </>
        )}
      </Button>

      {status && (
        <p
          className={cn(
            "text-sm",
            status.type === "error"
              ? "text-destructive"
              : "text-emerald-600 dark:text-emerald-400",
          )}
          role="status"
        >
          {status.msg}
        </p>
      )}
    </div>
  );
}
