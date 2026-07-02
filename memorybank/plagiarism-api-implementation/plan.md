## Plagiarism Checker Frontend Integration Plan

**Document Version:** 1.0  
**Last Updated:** 2025-11-09  
**Author:** Frontend Platform Team

---

## 1. Executive Summary

We are integrating the production plagiarism detection endpoint (`https://api-qa.shothik.ai/check/plagiarism/analyze`) into the existing plagiarism checker experience. The objective is to deliver a QuillBot-caliber interface backed by a reliable service layer. This document outlines the architecture, scope, and delivery plan—excluding analytics/logging per current requirements.

---

## 2. Experience Goals

- **Premium UX:** Sleek interface leveraging Tailwind + shadcn components, matching or surpassing competitor polish.
- **Clarity:** Results must communicate risk level, similarity percentages, and source attribution transparently.
- **Performance:** Fast interactions with graceful loading states and minimal layout shift.
- **Accessibility:** Keyboard-friendly, screen-reader supported, WCAG-compliant contrast ratios.
- **Maintainability:** Modular code adhering to separation of concerns and single-responsibility principles.

---

## 3. Architecture Overview

| Layer                         | Responsibility                                                        |
| ----------------------------- | --------------------------------------------------------------------- |
| Service (`plagiarismService`) | Network IO, retries, normalization, typed errors.                     |
| Hook (`usePlagiarismReport`)  | State orchestration, debouncing, manual refresh, lifecycle cleanup.   |
| UI Components                 | Presentational logic only (cards, accordions, badges, skeletons).     |
| Utilities                     | Transform raw payload into domain model, derive risk colors and copy. |

**Guidelines**

- Services return typed domain models, never raw JSON.
- Hooks mediate between UI event triggers and services.
- Components remain stateless where possible; rely on props for data and callbacks.

---

## 4. API Contract Alignment

### 4.1 Outstanding Questions

1. Authentication mechanism and token rotation strategy.
2. Maximum characters per request and supported languages.
3. Expected latency and whether long-running scans require polling.
4. Error response schema (codes, error strings, recommended handling).
5. Rate limits per user/package tier.

> **Action:** Resolve with backend before Phase 1. Capture findings in `memorybank/plagiarism-api-implementation/api-contract.md`.

### 4.2 Sample Request (to validate)

```json
POST https://api-qa.shothik.ai/check/plagiarism/analyze
{
  "text": "string",
  "language": "en"
}
```

### 4.3 Response Mapping (based on `plagiarismResponse.json`)

- `overallSimilarity` → report summary percentage.
- `paraphrasedSections[]` → ordered list of result accordion items.
- `paraphrasedPercentage` → supporting metrics.
- `sources[]` (top-level) → aggregated references for future use.
- `summary.riskLevel` → risk badge with color coding (`LOW`, `MEDIUM`, `HIGH`).

### 4.4 Domain Model

```typescript
export interface PlagiarismReport {
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  analyzedAt: string;
  sections: Array<{
    similarity: number;
    excerpt: string;
    sources: Array<{
      title: string;
      url: string;
      snippet: string;
      matchType: "exact" | "paraphrased";
      confidence: "low" | "medium" | "high";
    }>;
  }>;
  summary: {
    paraphrasedCount: number;
    paraphrasedPercentage: number;
    exactMatchCount: number;
  };
}
```

---

## 5. UI & UX Blueprint

### 5.1 Summary Panel

- Prominent similarity score with animated entrance.
- Risk-level badge (color-coded, textual label).
- Timestamp (“Last analyzed: 2 mins ago”).
- Optional upgrade CTA slot (future-ready but hidden for now).

### 5.2 Results Accordion

- Each section shows:
  - Circular similarity chip (color intensity scales with similarity).
  - Source title + domain.
  - Expandable excerpt with highlighted overlap hints (text emphasis using Tailwind utilities).
  - Source links (new tab) with tooltips indicating match type and confidence.
- Smooth transition animations via shadcn `Accordion`.

### 5.3 States & Microcopy

- **Loading:** use `Skeleton` + `Spinner`, text “Evaluating originality…”.
- **Empty:** illustration placeholder (SVG or CSS) with prompt text.
- **No Matches:** celebratory state (“Great news! No plagiarized segments detected.”).
- **Errors:** card with error icon, message, `Retry` button, context-specific help.

### 5.4 Responsiveness & Accessibility

- Stacked layout on mobile; sticky summary on desktop (if viewport height allows).
- All interactive elements keyboard reachable; accordions respond to Enter/Space.
- Announce score updates to screen readers (aria-live regions).

---

## 6. Proposed File Additions

```
src/
├── services/
│   └── plagiarismService.ts
├── hooks/
│   └── usePlagiarismReport.ts
├── components/
│   └── plagiarism/
│       ├── ReportSummary.tsx
│       ├── ReportSectionList.tsx
│       ├── ReportSectionItem.tsx
│       ├── EmptyReportState.tsx
│       └── ErrorStateCard.tsx
├── utils/
│   └── plagiarism/
│       ├── transformers.ts
│       └── riskHelpers.ts
test/
├── services/plagiarismService.test.ts
├── hooks/usePlagiarismReport.test.tsx
└── components/plagiarism/*.test.tsx
memorybank/
└── plagiarism-api-implementation/
    ├── plan.md
    └── api-contract.md (new)
```

---

## 7. Implementation Phases & Timeline

### Phase 1 – Discovery & Contract Lockdown (Day 0–1)

- [ ] Confirm API authentication, quotas, payload schema, and error codes.
- [ ] Document findings in `api-contract.md`.
- [ ] Align with product/design on final UI states and copy.

### Phase 2 – Service Layer Foundation (Day 1–2)

- [ ] Implement `plagiarismService.ts` with:
  - Fetch wrapper (abortable, timeout, retry policy if permitted).
  - Response normalization into `PlagiarismReport`.
  - Typed error mapping (`Unauthorized`, `QuotaExceeded`, `ValidationError`, `ServerError`).
- [ ] Write service unit tests (happy path + all error branches).

### Phase 3 – Hook & State Orchestration (Day 2–3)

- [ ] Build `usePlagiarismReport` hook.
  - Integrate with Redux slice if global state required; otherwise, maintain local state aligned with `useGlobalPlagiarismCheck`.
  - Manage loading flags, error state, manual refresh, and input resets.
  - Prevent concurrent scans (lock until prior request resolves or is cancelled).
- [ ] Hook test coverage (React Testing Library `renderHook`).

### Phase 4 – UI Composition & Integration (Day 3–4)

- [ ] Create modular components (`ReportSummary`, `ReportSectionList`, etc.).
- [ ] Refactor `PlagiarismCheckerContentSection` to consume new hook.
- [ ] Implement modern styling (cards, gradients, chips) within Tailwind + shadcn conventions.
- [ ] Ensure compatibility with `WordCounter` control and existing clear/scan interactions.

### Phase 5 – Quality Pass (Day 4–5)

- [ ] Accessibility sweep (keyboard, aria, labels).
- [ ] Responsive QA (mobile, tablet, desktop).
- [ ] Cross-browser smoke test (Chrome, Edge, Safari iOS).
- [ ] Unit + component tests green; run lint & type checks.
- [ ] Update documentation with any deviations from the plan.

### Phase 6 – UAT & Release Prep (Day 5)

- [ ] Conduct UAT with curated sample texts (short, long, boundary conditions).
- [ ] Validate error states with mocked backend responses (quota, unauthorized).
- [ ] Compile release notes and deployment checklist.
- [ ] Secure stakeholder sign-off prior to launch.

---

## 8. Error & Feedback Strategy

- **Unauthorized:** Dispatch `setShowLoginModal(true)` and halt scan.
- **Quota/Limit:** Display inline alert referencing upgrade flow; keep snackbar messaging consistent.
- **Network/Server Failure:** Show `ErrorStateCard` with retry option and fallback copy.
- **Validation Issues:** Highlight input constraints near `WordCounter` component.
- **Manual Refresh:** Disable button while request in-flight; debounce repeated clicks ~400ms.

---

## 9. Testing Strategy

| Layer      | Coverage Goals                                                         |
| ---------- | ---------------------------------------------------------------------- |
| Service    | 90%+ branch coverage; simulated 401/403/429/500.                       |
| Hook       | State transitions (initial → loading → success/error).                 |
| Components | Interaction tests: expand accordions, retry button, view source links. |
| Manual QA  | End-to-end flows (scan, clear, refresh, error).                        |

Additional checks:

- Verify no regressions for existing `useGlobalPlagiarismCheck` consumers.
- Ensure `WordCounter` remains synchronized with request lifecycle.

---

## 10. Accessibility & Performance Checklist

- Accordion meets WAI-ARIA Authoring Practices.
- `aria-live="polite"` region communicates result availability.
- Color palette validated via contrast checker.
- Avoid expensive re-renders via memoized derived state.
- Loading skeletons sized to match final content to prevent layout shift.
- Limit request frequency; consider exponential backoff on repeated server errors.

---

## 11. Risks & Mitigations

| Risk                                     | Impact | Mitigation                                                          |
| ---------------------------------------- | ------ | ------------------------------------------------------------------- |
| Undocumented API changes                 | High   | Lock contract early; add runtime validation with zod (optional).    |
| Long-running scan causing UX stalls      | Medium | Implement optimistic loader, consider timeout + user messaging.     |
| Inconsistent error handling across tools | Medium | Reuse existing alert/snackbar patterns; centralize error formatter. |
| Future analytics requirements            | Low    | Keep architecture ready for event hooks without polluting layers.   |

---

## 12. Open Questions

1. Will the API ever return streaming or partial results?
2. Is rate limiting per user, per package, or per IP?
3. Are there premium-only fields we should anticipate in the payload?
4. Should the UI surface citation formats (APA/MLA/Chicago) immediately or later?
5. Any localization roadmap to plan for copy extraction?

> Update this document once answers arrive.

---

## 13. Post-launch Enhancements (Future Work)

- Highlight plagiarized sentences directly within the input text.
- Provide downloadable PDF/CSV reports.
- Introduce saved scan history per user.
- Add localization and right-to-left layout support.
- Re-enable analytics instrumentation for usage insights.

---

## 14. Approval Checklist

- [ ] Backend contract confirmed.
- [ ] Design sign-off on UI blueprint.
- [ ] Engineering lead approval of architecture.
- [ ] QA sign-off on test plan.
- [ ] Stakeholder agreement on release criteria.

Once all boxes are checked, Phase 1 can commence.
