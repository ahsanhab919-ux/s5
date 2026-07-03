# Shothik Work — Vision vs. Codebase Gap Analysis

**Target codebase:** `ahsanhab919-ux/s5` (lean single-app extraction of `shothik-v3`, with the July 2026 improvements applied)
**Against:** Shothik Work — Product Vision & Design System (Apr 2026)
**Prepared:** July 2026
**Method:** Static inspection of the `src/` tree, route groups, Redux slices/APIs, services, models, and design tokens. No runtime testing.

---

## Executive summary

The s5 codebase is a mature **Layer 1 (Writing Tools)** product with a strong start on **Layer 2 (Writing Studio)**. It is essentially the QuillBot-adjacent surface the vision calls the "familiar entry point." What is almost entirely absent is the part that makes Shothik Work structurally distinct from competitors: the **agent systems (Twin, Second Me)**, the **human-agent Publication Pipeline (Layer 3)**, the **community/marketplace/creator economy**, and the **Agent Work Protocol**.

| Vision area | Status | One-line assessment |
|---|---|---|
| Layer 1 — Writing Tools | 🟢 **Largely built** | 9 of 11 tools have real routes/services |
| Layer 2 — Writing Studio | 🟡 **Partial** | Canvas + templates + citations exist; book/blog modules, manuscript upload, WRITING.md do not |
| Layer 3 — Publication Pipeline | 🔴 **Missing** | No community feed, marketplace, forum modes, or master-review flow |
| Twin (inbound agent) | 🔴 **Missing** | No ambient co-worker layer ("Twin" in code is a false-positive substring) |
| Second Me (outbound agent) | 🔴 **Missing** | No agent profile, dispatch, or CLI entry |
| Agent Work Protocol | 🔴 **Missing** | Not present in any form |
| Monetization | 🟡 **Partial** | Subscriptions + credits + multi-gateway payments live; marketplace 70/30, reviewer fund, royalties absent |
| Design system | 🟡 **Diverges** | Token architecture present, but fonts and palette do **not** match the spec |

Legend: 🟢 built · 🟡 partial · 🔴 missing

> **Important naming note:** the "agents" already in the app (`src/app/(primary-layout)/agents`, `src/components/agents/*`) are **task agents** for research and presentation generation — they are *not* the vision's Twin / Second Me. Reusing the word "agent" for two different concepts will cause confusion; the pipeline/agent-economy vision needs its own namespace.

---

## Layer 1 — Writing Tools

The vision lists 11 tools. Mapping to actual routes (`src/app/(primary-layout)/…`) and services (`src/services/…`):

| Vision tool | In code? | Evidence |
|---|---|---|
| **Paraphrase** | 🟢 Yes | `/paraphrase` route, `paraphrase.service.ts`, `redux/api/paraphrase`, `paraphraseHistorySlice`. NLP backend (`backend-services/nlp-inference-service`) now with humarin INT8 + optional GPU LLM backend. |
| **Grammar Correction** | 🟢 Yes | `/grammar-checker` route, `grammar-checker.service.ts`, `grammar-checker-slice`. |
| **Summarize** | 🟢 Yes | `/summarize` route. |
| **Translate** | 🟢 Yes | `/translator` route (NLLB translation model in NLP service). |
| **Humanize GPT** | 🟢 Yes | `/humanize-gpt` route, `redux/api/humanizeHistory`. |
| **AI Detection** | 🟢 Yes | `/ai-detector` route (+ `/shared`), `ai-detector.service.ts`, `ai-detector-slice`. |
| **Plagiarism Check** | 🟢 Yes | `/plagiarism-checker` route, `plagiarismService.ts`, `PlagiarismRequestManager.js`. |
| **Slide Generation** | 🟢 Yes | `(slide-layout)` group, `/slide`, presentation services + `slideEditSlice`, full slide editor. |
| **Research Paper** | 🟢 Yes | `/research` route, `research` API, `ResearchChat` model, research slices. |
| **Sheet Generation** | 🟢 Yes | `sheet` API (`/api/sheet/*`), `SheetSession`/`SheetChat`/`SheetConversation` models, `sheetSlice`. |
| **Re-educator** | 🔴 **Missing** | No route, service, or slice. The only tool with no implementation. |

**UX pattern gap:** the vision specifies a `+` button on the sidebar with a **hover-popup** listing all tools (Hick's Law, disappears on cursor exit). Current app exposes tools as **individual routed pages**, not an inline hover-popup that loads "with zero navigation change." The zero-navigation, inline-load behavior is a UX gap even though the tools themselves exist.

**Verdict:** 🟢 Layer 1 is the strongest area. Gaps: (1) build **Re-educator**; (2) rework tool access into the inline hover-popup pattern.

---

## Layer 2 — Writing Studio

Route `/writing-studio` → `WritingStudioContent.jsx` (TipTap editor). What exists vs. spec:

| Component | Status | Notes |
|---|---|---|
| Document canvas (long-form) | 🟢 Yes | TipTap `StarterKit` + Placeholder, Highlight, TextAlign, Link, BubbleMenu. |
| Writing templates | 🟢 Yes | `WRITING_TEMPLATES` (e.g. "Thesis Chapter"), `WritingTemplates.jsx`. |
| Citations / references | 🟢 Yes (strong) | `citation-lookup.js` (OpenLibrary, DOI, ISBN), `ReviewPanels.jsx` search by title/author/DOI/ISBN, multiple citation formats (APA/MLA/…), export "with references". |
| Export (DOCX/PDF) | 🟢 Yes | Export flow with format toast. |
| Onboarding | 🟢 Yes | `WritingStudioOnboarding.jsx` (first-visit tour via localStorage). |
| Diff / review panels | 🟢 Yes | `DiffPreview.jsx`, `ReviewPanels.jsx`. |
| **Real-time autosave (debounced 1.5s)** | 🔴 **Missing** | No document autosave; only an analysis-debounce `setTimeout` and onboarding flag in localStorage. |
| **Book writing module** (chapters, drag-reorder, publish-ready export) | 🔴 **Missing** | "Thesis Chapter" is a *template*, not a chapter-structured module. |
| **Blog writing module** (SEO fields, readability scoring) | 🔴 **Missing** | Blog exists only as marketing content under `(secondary-layout)/blogs`, not an authoring module. |
| **Manuscript upload** (continue/enhance existing PDF/DOCX) | 🔴 **Missing** | No manuscript-ingest path into the studio. |
| **WRITING.md** (persistent cross-session context) | 🔴 **Missing** | Zero references anywhere in the codebase. This is a keystone of the vision and does not exist. |
| **Twin layer** (ambient sidebar presence) | 🔴 **Missing** | See Agent Systems below. |

**Verdict:** 🟡 The editor foundation is genuinely good and citation handling is ahead of the vision's baseline. But the three modules (book/blog/manuscript), autosave, and especially **WRITING.md** — the mechanism that makes Twin "intelligent on session two" — are all absent.

---

## Layer 3 — Publication Pipeline

**Status: 🔴 essentially none of this exists.**

| Vision element | In code? |
|---|---|
| Agent drafts → Master reviews → approval flow | 🔴 No master-review workflow. |
| Community preview queue | 🔴 Not present. |
| Community Feed (Hot/New/Top, star gifting) | 🔴 Not present (one incidental "community feed" string, no feature). |
| Forum modes (agent-to-agent / agent+human / human-only) | 🔴 Not present (one incidental "forum" string). |
| ISBN assignment | 🔴 Only OpenLibrary ISBN *lookup* for citations — not assignment/publishing. |
| Shothik Store / marketplace distribution | 🔴 No marketplace, store, or distribution surface. |
| Reputation, star gifting | 🔴 "reputation" appears only in blog copy. |

**Verdict:** 🔴 This layer is greenfield. It is also the layer with the most product/technical risk (economic transactions, agent profiles, moderation, distribution partners).

---

## Agent Systems (Twin & Second Me)

**Status: 🔴 the vision's agent systems are not implemented.**

- **Twin (inbound co-worker):** No ambient sidebar presence, no proactive coordination, no session-context reasoning, no WRITING.md read/write. (16 "Twin" grep hits are all false positives inside `conTENTWINdow` / `beTWEEN` in presentation code.)
- **Second Me (outbound agent):** No agent profile, no custom profile picture, no skill profile, no reputation score, no dispatch-to-world, no marketplace income, no CLI/shell entry file.
- **BYOK (bring your own key):** 🔴 No "bring your own key" flow. (Note: users *can* select models in research agents — but that is not the BYOK-for-inference-billing model the vision describes.)
- **Agent Work Protocol:** 🔴 Absent entirely.

**What does exist and could be leveraged:** the current **task-agent framework** (`components/agents/shared/*` — `AgentContextProvider`, `AgentConfigurationPanel`, `AgentPromptInput`, `AgentResponseDisplay`, history, sharing). This is a solid substrate for building Second Me on top of, but it is oriented to one-shot research/presentation tasks, not persistent autonomous representatives.

---

## Monetization

| Vision stream | Status | Evidence |
|---|---|---|
| Active subscription (BDT/INR/USD tiers) | 🟢 Yes | `/pricing`, `/pricing/checkout`, `pricing.service.ts`, `redux/api/pricing`. |
| Credit packs / top-ups | 🟢 Yes | `wallet.service.ts`, `user-wallet-slice`, credit-based tools. |
| Multi-gateway payments | 🟢 Yes (beyond spec) | Stripe, Razorpay, bKash routes under `(secondary-layout)/payment/*`; Zoho webhook. |
| Reseller / affiliate | 🟢 Yes | `/reseller-panel`, `/affiliate-marketing`. |
| **Marketplace 70/30 split** | 🔴 Missing | No marketplace, no revenue split. |
| **Reviewer Fund (40% of platform share)** | 🔴 Missing | Not present. |
| **Agent Work Protocol fee** | 🔴 Missing | Not present. |
| **Global distribution royalties** | 🔴 Missing | Not present. |
| **BYOK platform fee** | 🔴 Missing | No BYOK. |

**Verdict:** 🟡 The *access* economy (subscriptions + credits + payments) is production-grade and multi-region. The *creator/agent* economy (marketplace, reviewer fund, protocol fees, royalties) — the differentiated revenue — is unbuilt.

---

## Design System

The token *architecture* is in place (`globals.css` defines `--primary`, `--background`, `--foreground`, `--accent`, `--muted` with a `--color-*` mapping and light/dark theming via `ThemeScript.tsx` + `ThemeToggle`). But the concrete values diverge from the spec.

| Spec | Vision value | In s5 | Match? |
|---|---|---|---|
| Heading font | **Playfair Display** (serif) | Manrope (sans) | 🔴 No |
| Body/UI font | **Inter** | Geist / Manrope | 🔴 No |
| Mono font | **JetBrains Mono** | Geist Mono | 🔴 No |
| `--primary` | Dark Navy `222 47% 11%` | not the spec value (accent-aliased) | 🔴 No |
| `--accent` | Vibrant Blue `210 100% 50%` | aliased to primary/foreground, not fixed blue | 🔴 No |
| `--muted` | Soft Gray-Blue `210 40% 96%` | present but not spec value | ⚠️ Partial |
| Card radius 12px / button 8px | specified | not verified as enforced tokens | ⚠️ Unverified |
| Twin presence indicator (ambient accent) | specified | 🔴 no Twin | 🔴 No |

**Verdict:** 🟡 Re-skinning is low-risk and mostly mechanical — swap the three Google fonts in `layout.tsx`, set the `:root` HSL values to the spec palette, and standardize radii. But it is **not** currently the vision's design language.

---

## Consolidated gap list (what to build)

**🔴 Missing (net-new):**
1. **Twin** — ambient co-worker layer in the studio sidebar (presence indicator, proactive cues, tool re-introduction).
2. **WRITING.md** — per-user persistent context document Twin reads/writes across sessions.
3. **Second Me** — agent profile, skill profile, reputation, dispatch, income dashboard.
4. **Agent Work Protocol** — delegation, agent-to-agent tasks, verifiable economic outcomes, privacy-boundary enforcement.
5. **Layer 3 Publication Pipeline** — master-review flow, community preview queue, Community Feed (Hot/New/Top + star gifting), 3 forum modes.
6. **Marketplace + creator economy** — 70/30 split, Reviewer Fund (12% gross, 40% of platform share redistributed), royalties, ISBN assignment.
7. **BYOK** billing mode (platform fee, not inference).
8. **Re-educator** writing tool.

**🟡 Partial (extend existing):**
9. **Writing Studio modules** — book (chapters + drag-reorder), blog (SEO + readability), manuscript upload/ingest.
10. **Autosave** — debounced 1.5s document persistence.
11. **Tool UX** — inline hover-popup (`+` button) replacing/augmenting routed tool pages.
12. **Design system** — swap to Playfair Display + Inter + JetBrains Mono; apply the navy/blue palette; standardize radii.

**🟢 Solid foundation to build on:**
- 9/11 Layer-1 tools, TipTap studio with citations, subscriptions/credits/multi-gateway payments, existing task-agent framework (reusable substrate for Second Me), theming architecture.

---

## Suggested sequencing (dependency-aware)

1. **Design-system alignment** (fonts, palette, radii) — cheap, unblocks everything visual, and makes the "familiar surface, novel depth" principle real.
2. **Writing Studio completion** — autosave → **WRITING.md** → book/blog/manuscript modules. WRITING.md first because it is Twin's prerequisite.
3. **Twin (inbound)** — build on the studio + WRITING.md; start with coordination cues and tool re-introduction before voice/vision edge work.
4. **Second Me (outbound)** on top of the existing task-agent framework — profile, dispatch, then CLI entry.
5. **Agent Work Protocol** — the trust/communication layer once Second Me exists.
6. **Layer 3 Publication Pipeline + Marketplace** — highest complexity and compliance surface; sequence last, after agents can produce reviewable output.

---

## Caveats

- This is a **static** analysis (routes, services, slices, models, tokens). It confirms presence/absence of features, not their runtime quality or completeness.
- The app still self-identifies internally as `shothik-v3` (package name), despite the "v4" commit message.
- Some features may live in the broader `shothikai-platform/shothik-platfrom1` monorepo (which has Convex, Stripe, Clerk, and 7 backend services) but are **not** in s5. This report is strictly about **s5**.
