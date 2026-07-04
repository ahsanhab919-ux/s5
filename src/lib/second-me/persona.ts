/**
 * Second Me — persona / config (Step 5).
 *
 * The delegable-mode analog of `TWIN_PERSONA` (src/lib/letta.ts). `TWIN_PERSONA`
 * tells a user's Letta agent how to behave as their *personal* writing partner.
 * A Second Me reuses the SAME agent and the SAME WRITING.md, but operates in a
 * *delegable* mode: work it performs is attributable to the user's identity
 * (SecondMeIdentity, Step 1) and shaped by the user's skill profile (Step 2,
 * personas student / writer / executive).
 *
 * This module is the persona/config DEFINITION only — the operating-instruction
 * strings plus a pure builder. It deliberately does NOT switch a live agent's
 * persona block, route jobs, or call Letta. Per spec §5 the job here is that the
 * same agent *can* operate in delegable mode; actually flipping an agent into
 * that mode at run time is delegation runtime (Phase 3+, explicitly out of
 * scope). Keeping this pure mirrors how `TWIN_PERSONA` is just a const consumed
 * at agent-creation time.
 *
 * Single source of truth: the persona list is imported from the Step 2 model
 * (SECOND_ME_PERSONAS) so the three surfaces — skill-profile storage, this
 * config, and any future UI — can never drift.
 *
 * Spec: SECOND-ME-SPEC.md §1 (one Second Me, three configs), §5 (persona/config),
 * src/lib/letta.ts (TWIN_PERSONA), src/models/SecondMeSkillProfile.ts.
 */

import {
    SECOND_ME_PERSONAS,
    type SecondMePersona,
} from '@/models/SecondMeSkillProfile';

/**
 * The shared delegable-mode preamble. Every persona instruction begins with this
 * so the trust-boundary invariants hold regardless of task type:
 *   - it is acting AS the user (attributable to their Second Me identity),
 *   - it must read WRITING.md (the same writing_md block Twin reads) first,
 *   - it stays within delegated scope and never invents authority.
 *
 * Written as a joined line array to match the TWIN_PERSONA style exactly.
 */
export const SECOND_ME_PERSONA_BASE = [
    "You are the user's Second Me, acting on their behalf inside Shothik.",
    'You operate in delegable mode: your work is attributable to the user\'s',
    'verifiable identity, so be accurate, bounded, and honest about uncertainty.',
    'The "writing_md" memory block is the user\'s WRITING.md — their living style',
    'guide (voice, audience, terminology, goals, do/don\'t rules). Always read',
    'writing_md before producing anything and follow it faithfully.',
    'Stay strictly within the task delegated to you; never assume authority you',
    'were not given, and surface anything that needs the user\'s decision.',
].join(' ');

/**
 * Per-persona role framing appended after the base preamble. These describe the
 * task-type LENS (spec §1: "three configs differentiated by task-type"), not new
 * powers — the trust boundary is fixed by the base above.
 *
 * Keyed by SecondMePersona so adding a persona to the model's union forces a
 * matching entry here at compile time (see the `satisfies` check below).
 */
export const SECOND_ME_PERSONA_ROLES = {
    student: [
        'Task lens — Student: help the user learn and produce coursework-style',
        'work. Show reasoning, cite sources, and prefer understanding over shortcuts.',
    ].join(' '),
    writer: [
        'Task lens — Writer: produce and refine long-form writing in the user\'s',
        'voice. Preserve meaning, honour the WRITING.md style rules, and keep the',
        'author\'s intent intact.',
    ].join(' '),
    executive: [
        'Task lens — Executive: deliver concise, decision-ready output. Lead with',
        'the recommendation, keep it brief and structured, and flag risks and',
        'assumptions explicitly.',
    ].join(' '),
} satisfies Record<SecondMePersona, string>;

/**
 * Build the full Second Me persona instruction for one persona: the shared
 * delegable-mode base followed by that persona's task lens. Pure — no I/O, no
 * Letta call, deterministic for a given persona.
 *
 * Throws on an unknown persona (exhaustiveness safety net; callers should pass a
 * validated SecondMePersona from the skill profile).
 */
export function buildSecondMePersona(persona: SecondMePersona): string {
    const role = SECOND_ME_PERSONA_ROLES[persona];
    if (!role) {
        // Should be unreachable for a well-typed caller; guards runtime callers
        // that pass an unvalidated string cast to the type.
        throw new Error(`buildSecondMePersona: unknown persona "${String(persona)}"`);
    }
    return `${SECOND_ME_PERSONA_BASE} ${role}`;
}

/**
 * The default Second Me persona instruction (writer lens), analogous to how
 * TWIN_PERSONA is a single ready-to-use string. Uses the same default persona as
 * the Step 2 skill-profile schema ('writer').
 */
export const SECOND_ME_PERSONA = buildSecondMePersona('writer');

// Re-export the canonical persona list/type so consumers of the persona config
// don't need to reach into the model directly.
export { SECOND_ME_PERSONAS };
export type { SecondMePersona };
