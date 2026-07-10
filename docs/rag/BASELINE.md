# Gate Drift-Catch Baseline

This is the measurement harness for the **isolated done-gate** (`src/lib/book/gate.ts`),
run before any retrieval-grounding work. It quantifies how well the gate — which judges a
chapter draft **in isolation**, without the story bible or prior chapters — catches known
drift and fabrication errors.

## The metric: drift-catch rate

Every fixture in `src/lib/book/eval/fixtures/` is a short chapter draft containing exactly
one **known, labelled error** relative to a `priorContext` (bible / prior-chapter facts).
The gate is asked to verify the draft:

- **Caught** = the gate rejected the draft (`!result.passed`).
- **Drift-catch rate** = caught / total.

Because every draft is deliberately wrong, a higher catch rate is better. The gate never
receives `priorContext`, so a low baseline is expected — that gap is the motivation for
retrieval grounding, and this harness lets us score a future grounded gate against the same
labelled set.

Rates are reported **overall** and **per kind** (fiction / non-fiction). The fixture set is
16 cases: **8 non-fiction + 8 fiction**, spanning four error types — `continuity`,
`fabrication`, `timeline`, `contradiction`.

## Layout

- `src/lib/book/eval/types.ts` — shared types (`EvalCase`, `BaselineReport`, …).
- `src/lib/book/eval/fixtures/` — the labelled eval set (`nonfiction.ts`, `fiction.ts`, `index.ts`).
- `src/lib/book/eval/harness.ts` — pure `runGateBaseline(cases, verifyChapter)`; the gate is **injected**.
- `src/lib/book/eval/report.ts` — pure `formatBaselineMarkdown(report)`.
- `src/lib/book/eval/*.test.ts` — unit tests (inject a deterministic fake gate; no model calls).

## How to regenerate the baseline

The harness is pure and takes an **injected** `verifyChapter`. The unit tests inject a fake;
a live baseline run injects the real gate built by `buildReEducatorGate(...)` (which makes
model calls — done by the caller, not the harness). A live run looks like:

```ts
import { buildReEducatorGate } from '@/lib/book/gate';
import { runGateBaseline } from '@/lib/book/eval/harness';
import { formatBaselineMarkdown } from '@/lib/book/eval/report';
import { EVAL_CASES } from '@/lib/book/eval/fixtures';

const verifyChapter = buildReEducatorGate();
const report = await runGateBaseline(EVAL_CASES, verifyChapter);
console.log(formatBaselineMarkdown(report));
```

Paste the resulting markdown table into the RESULTS section below.

To run the harness unit tests (no model calls, deterministic):

```
npx vitest run src/lib/book/eval
```

## RESULTS

**Baseline (run against the real `buildReEducatorGate()`, default config):**

**Overall drift-catch rate: 0.0% (0/16 known errors caught).**

| Kind | Caught | Total | Catch rate |
| --- | ---: | ---: | ---: |
| non-fiction | 0 | 8 | 0.0% |
| fiction | 0 | 8 | 0.0% |
| **overall** | 0 | 16 | 0.0% |

Every one of the 16 labelled drift/fabrication errors passed the gate uncaught.

### Why it is 0% — architectural, not a bug

The result is not noise; it follows directly from how the gate is wired. `buildReEducatorGate`
calls `runReEducator({ mode: 'review' })` **without a `semanticReview` provider and without a
`meaningVerifier`**. In that configuration the Review path runs only the **deterministic guards**
(`defaultGuards`): `readability`, `links`, `pii`, and — only when the caller supplies their data —
`terminology` and `voice-drift`. None of these guards make a model call, and none of them reason
about meaning, continuity, or facts:

- `readability` — sentence length / passive voice.
- `links` — malformed URL **structure** only (explicitly no network, no dead-link check).
- `pii` — emails / PII patterns.
- `terminology` / `voice-drift` — only registered when rules / a voice profile are passed (not here).

So the current done-gate is a **style/mechanics gate, not a faithfulness gate.** It structurally
*cannot* catch an eye-colour flip, a resurrected dead character, an invented citation, or a
fabricated statistic — those require either (a) the story bible / prior chapters as evidence
(retrieval grounding), or (b) an enabled semantic/meaning verifier. The gate never receives
`priorContext`, and even if it did, no active guard would use it.

### Implication for the RAG-grounding plan

- The R0 exit gate is cleared with maximum headroom: **catch rate is 0%, so any grounding that
  catches even a few of these errors is a strict improvement** on a measured baseline.
- The finding also refines *where* the fix belongs: grounding must feed a component that actually
  reasons about meaning. Two levers exist — enable the **`semanticReview` / `meaningVerifier`**
  path that already exists in `runReEducator`, and/or inject **retrieved bible/prior-chapter facts**
  as the evidence that path (or a new contradiction guard) checks against. R1 should do both:
  retrieval supplies the evidence; a meaning-aware verifier consumes it.

*(Regenerate anytime with `npx tsx scripts/rag-baseline.mts` — deterministic, no tokens, since the
default gate makes no model calls.)*

## R0.5 — probes (what they DID and DID NOT show)

Two throwaway probes were run after the baseline. Recording them honestly, including a
correction, because a misleading number must not sit in the repo docs as if it were evidence.

### Probe 1 — negative control (TRUSTWORTHY)

Three clean, error-free drafts were run through the real `buildReEducatorGate()`. All three were
**accepted** (`passed=true`, zero issues). This confirms the 0/16 baseline means the gate is
**blind to drift**, not that the gate/harness rejects everything. This result stands.

### Probe 2 — semantic-routing probe (RESULT CORRECTED)

A second probe re-ran the 16 error fixtures while injecting a **fake deterministic
`semanticReview`** that flags *every* draft with a `major` `unsupported-assertion`. It reported
"16/16 caught".

**That 16/16 does NOT mean a semantic reviewer catches drift, and the earlier framing of it as
"the free lever works (0 → 16/16)" is retracted.** The fake reviewer fires on *all* input, so it
would also have "caught" the three clean drafts — a 100% catch rate paired with a 100%
false-positive rate. What the probe actually establishes is narrower and purely structural:

- **When a semantic issue reaches `authorRequired`, the gate rejects the draft.** i.e. the
  routing/plumbing from `semanticReview` → blocking outcome → `passed=false` is wired correctly.

It says **nothing** about how well a *real* reviewer distinguishes drifted from clean text. Drift
**catch rate remains unmeasured.** The true metric requires (a) a real reviewer and (b) an eval set
that contains clean cases too, scored on **precision / false-positive rate**, not one-sided catch
rate.

### Corrected conclusion & sequence

- The 0% baseline is a **wiring gap** (no `semanticReview` is passed through `buildReEducatorGate`),
  not a routing gap. The seam exists in `engine.ts` / `review.ts` / `service.ts`.
- Before any feature code: **make the eval two-sided** — add clean/negative fixtures and report
  precision + recall + false-positive rate. An eval that can only go up is not an eval.
- **R1a** (expose the `semanticReview` option through `buildReEducatorGate`) is held until that
  two-sided metric exists to hold a real reviewer against.
- **Zvec/retrieval earns its place only later**, against the *residual* misses a real reviewer
  cannot close without evidence (e.g. a Ch1 eye-colour fact) — and only if false positives stay
  controlled.
