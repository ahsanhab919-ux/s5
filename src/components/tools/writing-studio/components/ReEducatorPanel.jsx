"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  Undo2,
  GraduationCap,
} from "lucide-react";
import { DiffPreview } from "./DiffPreview";

/**
 * ReEducatorPanel — the Writing Studio surface over POST /api/re-educator.
 *
 * The Re-educator reviews a manuscript and, depending on mode, either offers a
 * single confirmable patch (nudge), a reviewable issue panel (review /
 * paraphrase), or an authorized multi-round pass (auto). It never edits claims,
 * numbers, or the thesis silently — those come back as "author-required".
 *
 * This panel is deliberately built like WritingMdPanel: a self-contained client
 * component that talks to the Next.js route with plain fetch + credentials, and
 * renders whatever the uniform { mode, result, chain } envelope returns.
 *
 * Talks to: POST /api/re-educator
 * Spec: RE-EDUCATOR-SPEC.md §4 (modes), §6 (s5 integration).
 */

const MODES = [
  {
    id: "review",
    name: "Review",
    description: "Flag issues into a reviewable panel — nothing auto-applied without your OK.",
  },
  {
    id: "nudge",
    name: "Nudge",
    description: "Offer a single confirmable patch for a selected change.",
  },
  {
    id: "paraphrase",
    name: "Paraphrase",
    description: "Rephrase under the paraphrase profile, claims and numbers frozen.",
  },
  {
    id: "auto",
    name: "Auto",
    description: "Authorized multi-round pass — requires explicit opt-in.",
  },
];

// Disposition groups, in the order the author should read them. Applied first
// (confirm the diff), then the queue that still needs a human.
const GROUPS = [
  {
    key: "applied",
    label: "Applied",
    hint: "Auto-fixed and verified — confirm the diff below.",
    icon: CheckCircle2,
    tone: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "proposed",
    label: "Proposed",
    hint: "Drafted edits waiting for your OK.",
    icon: MessageSquare,
    tone: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "authorRequired",
    label: "Author required",
    hint: "Claims, numbers, or thesis — handed back untouched.",
    icon: AlertTriangle,
    tone: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "revertedRequeued",
    label: "Reverted",
    hint: "Attempted but reverted by VERIFY — re-queued, never silently kept.",
    icon: Undo2,
    tone: "text-destructive",
  },
];

function severityTone(severity) {
  switch (severity) {
    case "high":
      return "border-destructive/40 text-destructive";
    case "medium":
      return "border-amber-500/40 text-amber-600 dark:text-amber-400";
    default:
      return "border-muted-foreground/30 text-muted-foreground";
  }
}

/** One issue outcome row: category + severity + rationale, and any drafted edit. */
function IssueRow({ outcome }) {
  const issue = outcome?.issue ?? {};
  const edit = outcome?.edit;
  return (
    <div className="rounded-md border p-3 bg-background/60 space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">{issue.category ?? "issue"}</span>
        {issue.severity && (
          <Badge variant="outline" className={cn("text-[10px]", severityTone(issue.severity))}>
            {issue.severity}
          </Badge>
        )}
        {issue.source && (
          <span className="text-[10px] text-muted-foreground">{issue.source}</span>
        )}
      </div>
      {issue.rationale && (
        <p className="text-xs text-muted-foreground">{issue.rationale}</p>
      )}
      {edit && (
        <div className="text-xs grid gap-1 pt-1">
          <div className="bg-red-500/10 border border-red-500/20 rounded px-2 py-1 line-through opacity-70">
            {edit.before}
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded px-2 py-1">
            {edit.after}
          </div>
          {edit.reason && (
            <span className="text-[10px] text-muted-foreground">{edit.reason}</span>
          )}
        </div>
      )}
      {outcome?.note && (
        <p className="text-[10px] text-muted-foreground italic">{outcome.note}</p>
      )}
    </div>
  );
}

export default function ReEducatorPanel({ initialText = "", onAccept = undefined }) {
  const [text, setText] = useState(initialText);
  const [mode, setMode] = useState("review");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'error', msg }
  const [response, setResponse] = useState(null); // full envelope
  const [showDiff, setShowDiff] = useState(false);

  const run = useCallback(async () => {
    if (!text.trim()) {
      setStatus({ type: "error", msg: "Enter some text to re-educate." });
      return;
    }
    setRunning(true);
    setStatus(null);
    setResponse(null);
    setShowDiff(false);
    try {
      // Body per route contract (RE-EDUCATOR-SPEC §6). Nudge and auto carry
      // extra objects; here we drive the reviewer modes (review/paraphrase),
      // and pass a safe non-opt-in auto object so the route returns its refusal
      // envelope rather than a 400 when auto is selected without authorization.
      const body = { text, mode };
      if (mode === "auto") {
        body.auto = { optIn: false, authorization: null };
      }
      if (mode === "nudge") {
        // A whole-text nudge is not meaningful without a selected span; steer
        // the author to Review instead of sending an invalid request.
        setStatus({
          type: "error",
          msg: "Nudge needs a selected span. Use Review for a full-document pass.",
        });
        setRunning(false);
        return;
      }
      const res = await fetch("/api/re-educator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        setStatus({ type: "error", msg: "Please sign in to use the Re-educator." });
        return;
      }
      if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        setStatus({ type: "error", msg: data.error || "Invalid request." });
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setResponse(data);
      setShowDiff(true);
    } catch (e) {
      setStatus({ type: "error", msg: "Could not run the Re-educator. Try again." });
    } finally {
      setRunning(false);
    }
  }, [text, mode]);

  const result = response?.result;
  const panel = result?.panel;
  const summary = result?.summary;
  const revisedText = result?.text;

  // The confirmable diff only makes sense when the run actually changed the text.
  const hasChange = useMemo(
    () => typeof revisedText === "string" && revisedText !== text,
    [revisedText, text],
  );

  const acceptDiff = useCallback(() => {
    if (typeof revisedText === "string") {
      setText(revisedText);
      onAccept?.(revisedText);
    }
    setShowDiff(false);
  }, [revisedText, onAccept]);

  const rejectDiff = useCallback(() => setShowDiff(false), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Re-educator</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Reviews your text against your style guide. Claims, numbers, and thesis
        are never edited silently — they come back for you to decide.
      </p>

      <Textarea
        value={text}
        disabled={running}
        onChange={(e) => {
          setText(e.target.value);
          if (status) setStatus(null);
        }}
        placeholder="Paste the text you want reviewed…"
        className="min-h-[160px] text-sm leading-relaxed"
      />

      <div className="grid grid-cols-2 gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            title={m.description}
            className={cn(
              "p-2 rounded border text-xs transition-all text-left",
              mode === m.id
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "hover:border-primary/50 hover:bg-muted/50",
            )}
          >
            {m.name}
          </button>
        ))}
      </div>

      <Button onClick={run} disabled={running} className="w-full" size="lg">
        {running ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Running…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Run Re-educator
          </>
        )}
      </Button>

      {status && (
        <p className="text-sm text-destructive" role="status">
          {status.msg}
        </p>
      )}

      {response && (
        <div className="space-y-3">
          {summary && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Badge variant="secondary">{response.mode}</Badge>
              <span className="text-muted-foreground">
                {summary.total} issue{summary.total === 1 ? "" : "s"} ·{" "}
                {summary.applied} applied · {summary.proposed} proposed ·{" "}
                {summary.authorRequired} author · {summary.revertedRequeued} reverted
              </span>
            </div>
          )}

          {/* Auto refusal / status line (auto returns status + reason). */}
          {response.mode === "auto" && result?.status === "refused" && (
            <div className="rounded-md border border-amber-500/40 p-3 bg-amber-500/5 text-xs">
              {result.reason}
            </div>
          )}

          {panel &&
            GROUPS.map((group) => {
              const items = panel[group.key] ?? [];
              if (items.length === 0) return null;
              const Icon = group.icon;
              return (
                <div key={group.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", group.tone)} />
                    <span className="text-sm font-medium">
                      {group.label} ({items.length})
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{group.hint}</p>
                  <div className="space-y-2">
                    {items.map((outcome, i) => (
                      <IssueRow key={i} outcome={outcome} />
                    ))}
                  </div>
                </div>
              );
            })}

          {panel && summary && summary.total === 0 && (
            <div className="rounded-md border p-3 bg-muted/20 text-xs text-muted-foreground">
              No issues found. Your text is clean under the current style guide.
            </div>
          )}

          {showDiff && hasChange && (
            <DiffPreview
              original={text}
              modified={revisedText}
              onAccept={acceptDiff}
              onReject={rejectDiff}
            />
          )}
        </div>
      )}
    </div>
  );
}
