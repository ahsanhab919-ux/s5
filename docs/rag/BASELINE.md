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

**(pending live run)** — TBD.

No baseline number has been recorded yet. Run the snippet above against the real gate and
paste the generated table here.
