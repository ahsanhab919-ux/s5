/**
 * Re-educator — BYOK (bring-your-own-key) reviewer factory (Phase 2 #4).
 *
 * Phase 2 #3 gave us two real providers (`openAiProvider`, `anthropicProvider`)
 * behind the `SemanticProvider` contract, plus `providerToReviewer` which turns
 * a provider into the engine's `SemanticReviewer` seam with input scoping and
 * fail-closed output validation. This file is the small, pure glue that turns an
 * untrusted, per-request BYOK descriptor (provider name + key + optional model)
 * into a `SemanticReviewer` the service layer can pass straight through.
 *
 * Design rules (spec §7b#4):
 *   - PER-REQUEST ONLY. The key arrives on the request (body/header), is used to
 *     construct one provider for that run, and is never persisted and never
 *     logged. Encrypted-profile storage is an explicit later additive step.
 *   - Fail CLOSED to `undefined`. An absent/invalid descriptor yields NO
 *     reviewer, so the run proceeds deterministic-only. We never throw here — a
 *     bad key is a "no semantic pass", not a 500. (The provider itself also
 *     fails closed to `[]` at request time; this is the earlier gate.)
 *   - The key is a plain string parameter handed to the provider. This file does
 *     not inspect, transform, store, or emit it.
 *
 * Candidate-span binding (Phase 2 #6): `reviewerFromByok` prefers caller-supplied
 * candidate spans so only already-flagged/selected regions ever reach the model
 * (the cost + safety win), falling back to the whole document when the caller
 * supplies none. Either way the adapter applies hard caps (span count + chars)
 * and validates every returned span against the candidate set, and reports the
 * (post-cap) usage through an optional sink for the ledger.
 *
 * Spec: RE-EDUCATOR-SPEC.md §7b#4/§7b#6, §4a (cost model), §8 (fail-closed, never log key).
 */

import type { SemanticReviewer } from './engine';
import type { Span } from './types';
import type { SemanticProvider, ProviderCaps, SemanticUsage } from './provider';
import { providerToReviewer } from './provider';
import { openAiProvider, anthropicProvider } from './adapters';
import type { MeaningVerifier } from './entailment';
import { openAiVerifier, anthropicVerifier } from './entailment';

/** The provider names a BYOK request may select. Anything else ⇒ no reviewer. */
export const BYOK_PROVIDERS = ['openai', 'anthropic'] as const;
export type ByokProviderName = (typeof BYOK_PROVIDERS)[number];

/**
 * An untrusted per-request BYOK descriptor, as parsed from the request. Every
 * field is optional so a request that omits BYOK entirely maps cleanly to
 * "no descriptor ⇒ no reviewer".
 */
export interface ByokRequest {
  /** Which provider to construct. Must be one of BYOK_PROVIDERS. */
  provider?: string;
  /** The user-supplied API key. Never persisted, never logged. */
  apiKey?: string;
  /** Optional model handle override (else the adapter's cheap default). */
  model?: string;
}

/** True iff `name` is a supported BYOK provider. Narrowing type guard. */
export function isByokProvider(name: unknown): name is ByokProviderName {
  return typeof name === 'string' && (BYOK_PROVIDERS as readonly string[]).includes(name);
}

/**
 * Construct the concrete `SemanticProvider` for a validated descriptor, or
 * `null` if the provider name is unsupported. Pure; does not touch the network.
 * The key + model flow straight into the adapter options.
 */
function buildProvider(name: ByokProviderName, apiKey: string, model?: string): SemanticProvider {
  switch (name) {
    case 'openai':
      return openAiProvider({ apiKey, model });
    case 'anthropic':
      return anthropicProvider({ apiKey, model });
    default: {
      // Exhaustiveness: a new provider added to the union fails to compile here.
      const never: never = name;
      throw new Error(`unknown BYOK provider: ${String(never)}`);
    }
  }
}

/**
 * Turn an untrusted per-request BYOK descriptor into a `SemanticReviewer`, or
 * `undefined` when no usable descriptor is present (⇒ deterministic-only run).
 *
 * Returns `undefined` — never throws — when:
 *   - `byok` is absent/not an object,
 *   - `provider` is missing or not a supported provider,
 *   - `apiKey` is missing or empty.
 *
 * `textLength` is used only to size the fallback full-document candidate span
 * when the caller supplies none. When the manuscript is empty there is nothing
 * to review ⇒ `undefined`.
 *
 * `opts` (Phase 2 #6) carries the cost-guardrail wiring, all optional:
 *   - `candidateSpans`: the caller's regions of interest. When present, ONLY
 *     these regions ever reach the model (the cost + safety win, spec §4a).
 *     Absent/empty ⇒ fall back to the whole document, still hard-capped below.
 *   - `caps`: hard span-count / char bounds per run (absent ⇒ adapter defaults).
 *   - `writingMd`: the author's voice/rules context, threaded to the provider.
 *   - `onUsage`: sink for the (post-cap) usage record, for the ledger. Never
 *     receives the key or text.
 *
 * SECURITY: the key is passed by value to the provider and is otherwise
 * untouched here. It is never returned, stored, or logged (spec §8).
 */
export interface ReviewerFromByokOptions {
  candidateSpans?: Span[];
  caps?: ProviderCaps;
  writingMd?: string;
  onUsage?: (usage: SemanticUsage) => void;
}

export function reviewerFromByok(
  byok: ByokRequest | undefined,
  textLength: number,
  opts: ReviewerFromByokOptions = {},
): SemanticReviewer | undefined {
  if (!byok || typeof byok !== 'object') return undefined;
  if (!isByokProvider(byok.provider)) return undefined;
  if (typeof byok.apiKey !== 'string' || byok.apiKey.length === 0) return undefined;
  if (textLength <= 0) return undefined;

  const provider = buildProvider(byok.provider, byok.apiKey, byok.model);

  // Candidate-span binding (resolves CANDIDATE_SPANS_TODO): prefer the caller's
  // regions of interest so only already-flagged/selected regions reach the model.
  // Fall back to the whole document when the caller supplies none — safe (the
  // adapter validates every returned span and re-derives text from source) and
  // still cost-bounded by the hard caps the adapter applies.
  const hasCallerSpans = Array.isArray(opts.candidateSpans) && opts.candidateSpans.length > 0;
  const candidateSpans = hasCallerSpans
    ? (opts.candidateSpans as Span[])
    : [{ start: 0, end: textLength }];

  return providerToReviewer(provider, {
    candidateSpans,
    writingMd: opts.writingMd,
    caps: opts.caps,
    onUsage: opts.onUsage,
  });
}

/**
 * Turn the same untrusted per-request BYOK descriptor into a `MeaningVerifier`
 * (Phase 2 #5), or `undefined` when no usable descriptor is present. Built from
 * the same provider + key as the reviewer so a single BYOK descriptor powers both
 * the semantic REVIEW pass and the meaning-preservation VERIFY gate.
 *
 * Returns `undefined` — never throws — on the same conditions as
 * `reviewerFromByok` (absent/malformed descriptor, unsupported provider, missing
 * key). The verifier itself also fails closed to `false` at call time. The key is
 * passed by value and is never returned, stored, or logged (spec §8).
 */
export function verifierFromByok(byok: ByokRequest | undefined): MeaningVerifier | undefined {
  if (!byok || typeof byok !== 'object') return undefined;
  if (!isByokProvider(byok.provider)) return undefined;
  if (typeof byok.apiKey !== 'string' || byok.apiKey.length === 0) return undefined;

  switch (byok.provider) {
    case 'openai':
      return openAiVerifier({ apiKey: byok.apiKey, model: byok.model });
    case 'anthropic':
      return anthropicVerifier({ apiKey: byok.apiKey, model: byok.model });
    default: {
      const never: never = byok.provider;
      throw new Error(`unknown BYOK provider: ${String(never)}`);
    }
  }
}
