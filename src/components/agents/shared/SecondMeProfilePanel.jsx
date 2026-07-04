"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Save,
  KeyRound,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";

/**
 * SecondMeProfilePanel — the Step 6 profile surface for a user's Second Me.
 *
 * Composes the Steps 1–4 pieces into one minimal view/edit panel:
 *   - Identity (Step 1): read-only public key fingerprint + revoked status.
 *   - Skill profile (Step 2): editable personas / default persona / focus areas.
 *   - Reputation (Step 3): read-only karma + derived level.
 *   - Keys (Step 4): manage PERSISTED BYOK keys — presence only. Adding a key
 *     sends it once (via header) to be sealed server-side; the key is NEVER
 *     shown back. This is the deliberate difference from the Re-educator panel,
 *     whose key is session-only.
 *
 * Built like ReEducatorPanel: a self-contained client component talking to the
 * Next.js routes with plain fetch + credentials.
 *
 * Talks to: GET/PUT /api/second-me/profile, POST/DELETE /api/second-me/keys
 * Spec: SECOND-ME-SPEC.md §6.
 */

// The persona list is confirmed against the server payload; this is the fallback
// order/labels the editor renders before the snapshot loads.
const PERSONA_LABELS = {
  student: "Student",
  writer: "Writer",
  executive: "Executive",
};

// BYOK providers a key can be stored for (mirrors BYOK_PROVIDERS in byok.ts).
const KEY_PROVIDERS = [
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
];

export default function SecondMeProfilePanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'error'|'ok', msg }

  const [identity, setIdentity] = useState(null);
  const [reputation, setReputation] = useState(null);
  const [personaOptions, setPersonaOptions] = useState(["student", "writer", "executive"]);
  const [keys, setKeys] = useState([]);

  // Editable skill-profile state.
  const [personas, setPersonas] = useState([]);
  const [defaultPersona, setDefaultPersona] = useState("writer");
  const [focusText, setFocusText] = useState(""); // comma/newline separated

  // Add-key form state (the plaintext key is held only until POST, never stored).
  const [keyProvider, setKeyProvider] = useState("openai");
  const [keyValue, setKeyValue] = useState("");
  const [keyBusy, setKeyBusy] = useState(false);

  const applySnapshot = useCallback((data) => {
    setIdentity(data.identity ?? null);
    setReputation(data.reputation ?? null);
    setKeys(Array.isArray(data.keys) ? data.keys : []);
    if (Array.isArray(data.personas) && data.personas.length) {
      setPersonaOptions(data.personas);
    }
    const sp = data.skillProfile;
    if (sp) {
      setPersonas(Array.isArray(sp.personas) ? sp.personas : []);
      setDefaultPersona(sp.defaultPersona || "writer");
      setFocusText((Array.isArray(sp.focusAreas) ? sp.focusAreas : []).join(", "));
    } else {
      // No profile yet — seed the schema default so a first save is one click.
      setPersonas(["writer"]);
      setDefaultPersona("writer");
      setFocusText("");
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/second-me/profile", { credentials: "include" });
      if (res.status === 401) {
        setStatus({ type: "error", msg: "Please sign in to view your Second Me." });
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      applySnapshot(await res.json());
    } catch {
      setStatus({ type: "error", msg: "Could not load your Second Me profile." });
    } finally {
      setLoading(false);
    }
  }, [applySnapshot]);

  useEffect(() => {
    load();
  }, [load]);

  const togglePersona = useCallback((id) => {
    setStatus(null);
    setPersonas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }, []);

  const parseFocusAreas = useCallback(
    () =>
      focusText
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    [focusText],
  );

  const save = useCallback(async () => {
    if (personas.length === 0) {
      setStatus({ type: "error", msg: "Pick at least one persona." });
      return;
    }
    // Keep the default persona consistent with the enabled set.
    const chosenDefault = personas.includes(defaultPersona) ? defaultPersona : personas[0];
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/second-me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          personas,
          defaultPersona: chosenDefault,
          focusAreas: parseFocusAreas(),
        }),
      });
      if (res.status === 401) {
        setStatus({ type: "error", msg: "Please sign in to save." });
        return;
      }
      if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        setStatus({ type: "error", msg: data.error || "Invalid profile." });
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (data.skillProfile) {
        setPersonas(data.skillProfile.personas);
        setDefaultPersona(data.skillProfile.defaultPersona);
        setFocusText((data.skillProfile.focusAreas || []).join(", "));
      }
      setStatus({ type: "ok", msg: "Profile saved." });
    } catch {
      setStatus({ type: "error", msg: "Could not save your profile." });
    } finally {
      setSaving(false);
    }
  }, [personas, defaultPersona, parseFocusAreas]);

  const addKey = useCallback(async () => {
    if (!keyValue.trim()) {
      setStatus({ type: "error", msg: "Enter an API key to store." });
      return;
    }
    setKeyBusy(true);
    setStatus(null);
    try {
      // Provider in the body; the key goes in the header so it stays out of any
      // captured body. It is sealed server-side and never returned.
      const res = await fetch("/api/second-me/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-second-me-key": keyValue.trim(),
        },
        credentials: "include",
        body: JSON.stringify({ provider: keyProvider }),
      });
      if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        setStatus({ type: "error", msg: data.error || "Could not store key." });
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setKeyValue(""); // clear the plaintext from the form immediately
      await load(); // refresh the presence-only list (clears status)
      setStatus({ type: "ok", msg: "Key stored securely." }); // set AFTER reload
    } catch {
      setStatus({ type: "error", msg: "Could not store your key." });
    } finally {
      setKeyBusy(false);
    }
  }, [keyProvider, keyValue, load]);

  const removeKey = useCallback(
    async (provider) => {
      setKeyBusy(true);
      setStatus(null);
      try {
        const res = await fetch("/api/second-me/keys", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ provider }),
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        await load();
        setStatus({ type: "ok", msg: "Key removed." }); // set AFTER reload
      } catch {
        setStatus({ type: "error", msg: "Could not remove your key." });
      } finally {
        setKeyBusy(false);
      }
    },
    [load],
  );

  const storedProviders = new Set(keys.map((k) => k.provider));

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your Second Me…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <UserCog className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Second Me profile</span>
      </div>

      {/* Identity (read-only, public only) */}
      <div className="rounded-md border p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Identity</span>
        </div>
        {identity ? (
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <div>
              Key ID: <span className="font-mono">{identity.keyId}</span>
            </div>
            {identity.revoked ? (
              <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
                revoked
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                active
              </Badge>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Not set up yet — your Second Me identity is created the first time it acts on your behalf.
          </p>
        )}
        {reputation && (
          <div className="text-[11px] text-muted-foreground pt-1">
            Reputation: level {reputation.level} · {reputation.karma} karma
          </div>
        )}
      </div>

      {/* Skill profile (editable) */}
      <div className="space-y-2">
        <span className="text-xs font-medium">Personas</span>
        <p className="text-[10px] text-muted-foreground">
          What your Second Me is configured to do. Pick one or more; the default is used when a task doesn&apos;t specify one.
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {personaOptions.map((id) => {
            const on = personas.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => togglePersona(id)}
                className={cn(
                  "p-2 rounded border text-xs transition-all",
                  on
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "hover:border-primary/50 hover:bg-muted/50",
                )}
              >
                {PERSONA_LABELS[id] || id}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] text-muted-foreground">Default</span>
          <select
            aria-label="Default persona"
            value={defaultPersona}
            onChange={(e) => setDefaultPersona(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            {personas.map((id) => (
              <option key={id} value={id}>
                {PERSONA_LABELS[id] || id}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 pt-1">
          <span className="text-[11px] text-muted-foreground">Focus areas (comma separated)</span>
          <input
            type="text"
            aria-label="Focus areas"
            value={focusText}
            onChange={(e) => setFocusText(e.target.value)}
            placeholder="e.g. molecular biology, sci-fi"
            className="h-9 w-full rounded-md border bg-background px-2 text-xs"
          />
        </div>
      </div>

      {/* Keys (persisted, presence-only) */}
      <div className="rounded-md border border-dashed p-3 space-y-2">
        <div className="flex items-center gap-2">
          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Stored keys</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Keys are encrypted at rest and reused for delegated work. Your key is stored securely and never shown again.
        </p>

        {keys.length > 0 && (
          <div className="space-y-1.5">
            {keys.map((k) => (
              <div key={k.provider || k.purpose} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  {k.provider || k.purpose} · stored
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${k.provider} key`}
                  disabled={keyBusy}
                  onClick={() => removeKey(k.provider)}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-1">
          <select
            aria-label="Key provider"
            value={keyProvider}
            disabled={keyBusy}
            onChange={(e) => setKeyProvider(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-xs"
          >
            {KEY_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="password"
            aria-label="API key"
            value={keyValue}
            disabled={keyBusy}
            onChange={(e) => setKeyValue(e.target.value)}
            placeholder="API key"
            autoComplete="off"
            className="col-span-2 h-9 w-full rounded-md border bg-background px-2 text-xs"
          />
        </div>
        <Button
          onClick={addKey}
          disabled={keyBusy}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {keyBusy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              Storing…
            </>
          ) : (
            <>
              {storedProviders.has(keyProvider) ? "Replace" : "Store"} key
            </>
          )}
        </Button>
      </div>

      <Button onClick={save} disabled={saving} className="w-full" size="lg">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save profile
          </>
        )}
      </Button>

      {status && (
        <p
          className={cn(
            "text-sm",
            status.type === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400",
          )}
          role="status"
        >
          {status.msg}
        </p>
      )}
    </div>
  );
}
