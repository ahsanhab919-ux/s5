# Applied Changes — Research → Codebase

_All changes are local (nothing pushed). Build verified: `npm run build` → exit 0, 51/51 pages generated._

Four research-backed improvements were implemented. Summary and diffstat below.

---

## 1. Paraphrase model upgrade (lowest-effort quality win)

Swapped the paraphraser from the generalist `google/flan-t5-base` to the purpose-built **`humarin/chatgpt_paraphraser_on_T5_base`** — same T5-base architecture (250M), same tokenizer, same CTranslate2 INT8 path, so RAM footprint is unchanged (~250MB) but paraphrase quality is measurably better (trained on ~420K ChatGPT paraphrase pairs).

- `backend-services/nlp-inference-service/scripts/download_and_convert_models.py` — model id + docstring.
- `backend-services/nlp-inference-service/services/paraphrase_engine.py` — switched to the model's trained `paraphrase: {text}` prefix (mode is now expressed via decoding params, not verbose flan-t5 instructions); added `no_repeat_ngram_size=2` and stronger top-k/temperature for "creative" mode.
- License: OpenRAIL (commercial use OK with attribution).
- Note: the multilingual NLLB pivot pipeline is unchanged.

**To activate:** re-run the model build step (`--step t5`) so the new model is downloaded and re-converted to `/models/paraphrase`.

## 2. console.log guardrails (prevents the earlier build breakage recurring)

- `next.config.ts` — added `compiler.removeConsole` (production only, keeps `error`/`warn`). SWC strips console calls at **build time**, removing the whole expression — so the orphaned-argument/dangling-paren breakage a source-level codemod caused can never happen again. (Verified no `.babelrc` exists, so SWC is active.)
- `eslint.config.mjs` — `no-console` now `["warn", { allow: ["error", "warn"] }]`, matching build behavior.
- `package.json` + `.husky/pre-commit` — added **husky** + **lint-staged** running `eslint --max-warnings=0` on staged JS/TS at commit time.

## 3. Dependency upgrades + audit fixes

- **Next.js `16.0.7` → `16.2.9`** — closes the May-2026 security batch, incl. the CVSS 9.5 route-param auth-bypass (GHSA-492v-c6pp-mqqv).
- **Mongoose `9.1.1` → `9.6.3`** — closes the NoSQL-injection advisory (GHSA-wpg9-53fq-2r8h) and improves TS query typing.
- **`npm audit fix`** + a `postcss@^8.5.10` `overrides` entry (GHSA-qx2v-qp2m-jg93) — reduced vulnerabilities **30 → 4**.
- Mongoose 9's stricter query generics surfaced type errors in three models; fixed by giving each an explicit interface + typed model export:
  `src/models/SheetSession.ts`, `SheetChat.ts`, `SheetConversation.ts`.

**Remaining 4 vulnerabilities (left for your team — each needs a judgment call):**
| Package | Severity | Why not auto-fixed |
|---|---|---|
| `jspdf` | critical | Fix requires major bump to v4 (breaking PDF-export API) |
| `xlsx` (SheetJS) | high | No npm fix exists — SheetJS ships fixes off-registry only |
| `next` | moderate | Advisory range covers canaries up to 16.3.0-canary; does not apply to stable 16.2.9 |
| `@bprogress/next` / `monaco` / `dompurify` | low/moderate | Residual transitive; verify before bumping |

## 4. CASL access-control layer (structural IDOR fix)

Introduced a centralized ownership layer so the `get_my_chats`-style IDOR class is prevented at the query layer instead of per-route discipline.

- **New** `src/lib/ability.ts` — defines `defineAbilityFor(user)`: a user can only read/update/delete resources where `userId` matches their id.
- **New** `src/lib/access-control.ts` — `getAccessContext()` (auth + ability) and `ownerId(user)` helpers.
- `src/lib/dbConnect.ts` — registers `accessibleRecordsPlugin` globally (once), adding `Model.accessibleBy(ability)`.
- `src/models/SheetSession.ts` — typed as `AccessibleRecordModel` so `.accessibleBy` type-checks.
- `src/app/api/sheet/chat/get_my_chats/route.ts` — now requires auth and returns only the caller's sessions via `accessibleBy` (was returning ALL sessions unfiltered).
- `src/app/api/sheet/conversation/create_conversation/route.ts` — now requires auth, stamps the real `userId` (was hardcoded `'temp-user'`), and scopes session reuse to the owner.

**Research-chat routes migrated onto CASL (folds in PR #1625):**
- `src/models/ResearchChat.ts` — typed as `AccessibleRecordModel`.
- `src/app/api/research/chat/delete_chat/[id]/route.ts` — now requires auth and does an **owner-scoped delete** (`findOneAndDelete({ _id, userId })`); previously `findByIdAndDelete(id)` let any user delete any chat.
- `src/app/api/research/chat/update_name/[id]/route.ts` — now requires auth, **owner-scoped update**, and writes to the real `name` field (was `{ title: name }`, a no-op since the schema has no `title` field — this is PR #1625's fix).
- `get_my_chats` and `get_one_chat` already scoped correctly (with `.select('-messages').lean()` optimizations and a test file), so they were left as-is to avoid regressions.

**Consolidated patch:** all changes (build fixes + these four items) are packaged in `shothik-v4-all-changes.patch` — apply with `git apply` then `npm install`. Verified it reverse-applies cleanly against the built tree.

---

## GPU LLM paraphrase backend (optional, opt-in)

Adds a second, GPU-accelerated paraphrase backend alongside the default CPU
CTranslate2 path. Selected at runtime via `PARAPHRASE_BACKEND` — no code change,
default behavior unchanged.

- **NEW** `backend-services/nlp-inference-service/services/llm_paraphrase_backend.py` — `LLMParaphraseBackend`, a thin HTTP client for an OpenAI-compatible chat server (llama.cpp `llama-server` / Ollama / vLLM / TGI). Same `generate_paraphrases(text, mode, num_variants, language)` signature as `ParaphraseEngine`. Per-mode system prompts, native multilingual (no NLLB pivot), rising temperature per variant, `health()` check, fail-soft error handling.
- **NEW** `backend-services/nlp-inference-service/services/config.py` — env-driven config: `PARAPHRASE_BACKEND` (`ctranslate2` default / `llm`), `LLM_SERVER_URL` (default `http://localhost:8081/v1` — 8081 avoids the NLP service's own 8080), `LLM_MODEL` (`phi-4-mini`), `LLM_TIMEOUT`, plus the existing `PARAPHRASE_MODEL_PATH` / `TRANSLATION_MODEL_PATH`.
- **EDITED** `routes/paraphrase.py` — `get_engine()` picks the backend via `config.PARAPHRASE_BACKEND`; cached `_get_llm_backend()` singleton.
- **EDITED** `socket_app.py` — same backend selection via cached `_get_socket_llm_backend()`. Also fixed a pre-existing latent bug: the `Mode=` log line referenced `mode` before it was assigned.
- **EDITED** `requirements.txt` — added `requests` (used by the new backend).
- **NEW** `GPU-LLM-PARAPHRASE.md` — model download, llama.cpp serving (`-ngl 99` full offload, Phi-4-mini / Qwen3-4B Q4_K_M), Docker GPU setup, and env reference.

Target latency: ~80–120 ms/paraphrase on an 8 GB GPU vs ~300–600 ms for the CPU T5 path. To enable: set `PARAPHRASE_BACKEND=llm` and run a `llama-server` on port 8081. See `GPU-LLM-PARAPHRASE.md`.

---

## Diffstat (applied changes only)

```
 backend-services/.../download_and_convert_models.py |  8 +++--
 backend-services/.../paraphrase_engine.py           | 27 +++++-----
 next.config.ts                                      | 10 ++++
 eslint.config.mjs                                   |  4 +-
 package.json                                        | 19 ++++--
 src/lib/dbConnect.ts                                | 10 ++++
 src/lib/ability.ts                                  | NEW
 src/lib/access-control.ts                           | NEW
 src/models/SheetSession.ts                          | 25 ++++++--
 src/models/SheetChat.ts                             | 22 +++++--
 src/models/SheetConversation.ts                     | 21 ++++--
 src/app/api/sheet/chat/get_my_chats/route.ts        | 13 +++--
 src/app/api/sheet/conversation/create_conversation/route.ts | 14 +++--
 .husky/pre-commit                                   | NEW
```
