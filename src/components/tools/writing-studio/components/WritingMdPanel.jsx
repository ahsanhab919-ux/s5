"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * WritingMdPanel — the WRITING.md editor (Phase 1 keystone).
 *
 * WRITING.md is the user's living style guide (voice, audience, terminology,
 * goals). It is persisted in Letta as a core-memory block on the user's agent,
 * so Twin reads it before drafting and can update it over time.
 *
 * Talks to: GET/PATCH /api/writing-md
 */
export default function WritingMdPanel() {
  const [content, setContent] = useState("");
  const [limit, setLimit] = useState(20000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'ok'|'error', msg }
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/writing-md", { credentials: "include" });
      if (res.status === 401) {
        setStatus({ type: "error", msg: "Please sign in to use WRITING.md." });
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setContent(data.content ?? "");
      setLimit(data.limit ?? 20000);
      setUpdatedAt(data.updatedAt ?? null);
      setDirty(false);
    } catch (e) {
      setStatus({ type: "error", msg: "Could not load WRITING.md. Try again." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/writing-md", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      if (res.status === 413) {
        setStatus({
          type: "error",
          msg: `WRITING.md is over the ${limit.toLocaleString()}-character limit.`,
        });
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setUpdatedAt(data.updatedAt ?? new Date().toISOString());
      setDirty(false);
      setStatus({ type: "ok", msg: "Saved. Twin will use this going forward." });
    } catch (e) {
      setStatus({ type: "error", msg: "Could not save. Try again." });
    } finally {
      setSaving(false);
    }
  }, [content, limit]);

  const overLimit = content.length > limit;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          WRITING.md
          {dirty && (
            <span className="text-xs font-normal text-muted-foreground">
              (unsaved changes)
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Your living style guide — voice, audience, terminology, and goals.
          Twin reads this before every draft and keeps it in mind.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={content}
          disabled={loading}
          onChange={(e) => {
            setContent(e.target.value);
            setDirty(true);
            if (status) setStatus(null);
          }}
          placeholder={loading ? "Loading…" : "# WRITING.md"}
          className="min-h-[360px] font-mono text-sm leading-relaxed"
          spellCheck={false}
        />

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            <span className={overLimit ? "text-destructive font-medium" : ""}>
              {content.length.toLocaleString()} / {limit.toLocaleString()}
            </span>
            {updatedAt && !dirty && (
              <span className="ml-3">
                Last saved {new Date(updatedAt).toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={load}
              disabled={loading || saving}
            >
              Reset
            </Button>
            <Button
              onClick={save}
              disabled={loading || saving || overLimit || !dirty}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        {status && (
          <p
            className={
              status.type === "error"
                ? "text-sm text-destructive"
                : "text-sm text-emerald-600 dark:text-emerald-400"
            }
            role="status"
          >
            {status.msg}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
