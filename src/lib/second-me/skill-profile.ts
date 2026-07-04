/**
 * Second Me — skill profile service (Step 2 of SECOND-ME-SPEC.md §6).
 *
 * The skill profile records WHICH personas a user's Second Me can act as
 * (student / writer / executive) plus optional focus areas. This module is the
 * validation + persistence layer: a hand-rolled `parseSkillProfile` (mirroring
 * the Re-educator's `parseRequest` discipline — typeof/enum checks, a dedicated
 * error type, no zod) and get/put helpers over the Mongoose model.
 *
 * No API route here (later step). The parse function is pure + fully
 * unit-testable; the get/put helpers touch the DB and are mocked in tests.
 */
import dbConnect from '@/lib/dbConnect';
import SecondMeSkillProfile, {
    ISecondMeSkillProfile,
    SECOND_ME_PERSONAS,
    SecondMePersona,
} from '@/models/SecondMeSkillProfile';

/** Thrown when an incoming skill-profile payload is invalid. */
export class SkillProfileError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SkillProfileError';
    }
}

/** Upper bound on focus areas — keeps the profile small and the block bounded. */
export const MAX_FOCUS_AREAS = 12;
/** Upper bound on a single focus-area string. */
export const MAX_FOCUS_AREA_LEN = 80;

/** The validated shape a caller may set (userId is supplied separately, server-side). */
export interface SkillProfileInput {
    personas: SecondMePersona[];
    defaultPersona: SecondMePersona;
    focusAreas: string[];
}

function isPersona(v: unknown): v is SecondMePersona {
    return typeof v === 'string' && (SECOND_ME_PERSONAS as readonly string[]).includes(v);
}

/**
 * Validate + normalize an incoming skill-profile payload. Pure; no I/O.
 * Rules:
 *  - `personas` must be a non-empty array of known personas (deduped).
 *  - `defaultPersona` must be a known persona AND be present in `personas`.
 *  - `focusAreas` optional; each a non-empty string, trimmed, bounded in count
 *    and length; deduped. Missing/empty ⇒ [].
 */
export function parseSkillProfile(body: unknown): SkillProfileInput {
    if (typeof body !== 'object' || body === null) {
        throw new SkillProfileError('Body must be a JSON object.');
    }
    const b = body as Record<string, unknown>;

    if (!Array.isArray(b.personas) || b.personas.length === 0) {
        throw new SkillProfileError('Body must include a non-empty "personas" array.');
    }
    const personas: SecondMePersona[] = [];
    for (const p of b.personas) {
        if (!isPersona(p)) {
            throw new SkillProfileError(
                `Unknown persona "${String(p)}". Must be one of: ${SECOND_ME_PERSONAS.join(', ')}.`
            );
        }
        if (!personas.includes(p)) personas.push(p);
    }

    if (!isPersona(b.defaultPersona)) {
        throw new SkillProfileError(
            `Body "defaultPersona" must be one of: ${SECOND_ME_PERSONAS.join(', ')}.`
        );
    }
    if (!personas.includes(b.defaultPersona)) {
        throw new SkillProfileError(
            `"defaultPersona" (${b.defaultPersona}) must also be listed in "personas".`
        );
    }

    let focusAreas: string[] = [];
    if (b.focusAreas !== undefined) {
        if (!Array.isArray(b.focusAreas)) {
            throw new SkillProfileError('"focusAreas" must be an array of strings when provided.');
        }
        const seen = new Set<string>();
        for (const f of b.focusAreas) {
            if (typeof f !== 'string') {
                throw new SkillProfileError('Each "focusAreas" entry must be a string.');
            }
            const trimmed = f.trim();
            if (trimmed.length === 0) continue;
            if (trimmed.length > MAX_FOCUS_AREA_LEN) {
                throw new SkillProfileError(
                    `A "focusAreas" entry exceeds ${MAX_FOCUS_AREA_LEN} characters.`
                );
            }
            if (!seen.has(trimmed)) {
                seen.add(trimmed);
                focusAreas.push(trimmed);
            }
        }
        if (focusAreas.length > MAX_FOCUS_AREAS) {
            throw new SkillProfileError(`Too many focus areas (max ${MAX_FOCUS_AREAS}).`);
        }
    }

    return { personas, defaultPersona: b.defaultPersona, focusAreas };
}

/** Read a user's skill profile, or null if none set yet. */
export async function getSkillProfile(
    userId: string
): Promise<ISecondMeSkillProfile | null> {
    if (!userId) throw new SkillProfileError('getSkillProfile: userId is required');
    await dbConnect();
    return SecondMeSkillProfile.findOne({ userId });
}

/**
 * Create-or-update a user's skill profile from a validated payload. Idempotent
 * upsert keyed on userId (one profile per user).
 */
export async function putSkillProfile(
    userId: string,
    body: unknown
): Promise<ISecondMeSkillProfile> {
    if (!userId) throw new SkillProfileError('putSkillProfile: userId is required');
    const input = parseSkillProfile(body);
    await dbConnect();

    const existing = await SecondMeSkillProfile.findOne({ userId });
    if (existing) {
        existing.personas = input.personas;
        existing.defaultPersona = input.defaultPersona;
        existing.focusAreas = input.focusAreas;
        return existing.save();
    }
    return SecondMeSkillProfile.create({ userId, ...input });
}
