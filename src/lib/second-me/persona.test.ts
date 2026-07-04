import { describe, it, expect } from 'vitest';
import {
    SECOND_ME_PERSONA,
    SECOND_ME_PERSONA_BASE,
    SECOND_ME_PERSONA_ROLES,
    SECOND_ME_PERSONAS,
    buildSecondMePersona,
    type SecondMePersona,
} from './persona';

// Pure module — no mocks, no DB, no Letta. Just assert the strings and builder.

describe('SECOND_ME_PERSONA_BASE (trust-boundary invariants)', () => {
    it('states it is the user\'s Second Me acting on their behalf', () => {
        expect(SECOND_ME_PERSONA_BASE).toContain('Second Me');
        expect(SECOND_ME_PERSONA_BASE.toLowerCase()).toContain('on their behalf');
    });

    it('names delegable mode and attributable identity', () => {
        expect(SECOND_ME_PERSONA_BASE.toLowerCase()).toContain('delegable mode');
        expect(SECOND_ME_PERSONA_BASE.toLowerCase()).toContain('attributable');
    });

    it('requires reading the writing_md block first (same block Twin reads)', () => {
        expect(SECOND_ME_PERSONA_BASE).toContain('writing_md');
        expect(SECOND_ME_PERSONA_BASE.toLowerCase()).toContain('read');
    });

    it('bounds scope — no assumed authority', () => {
        expect(SECOND_ME_PERSONA_BASE.toLowerCase()).toContain('within the task');
        expect(SECOND_ME_PERSONA_BASE.toLowerCase()).toContain('authority');
    });
});

describe('SECOND_ME_PERSONA_ROLES', () => {
    it('has exactly one entry per persona in SECOND_ME_PERSONAS', () => {
        expect(Object.keys(SECOND_ME_PERSONA_ROLES).sort()).toEqual(
            [...SECOND_ME_PERSONAS].sort()
        );
    });

    it('each role is a non-empty distinct task lens', () => {
        const roles = Object.values(SECOND_ME_PERSONA_ROLES);
        roles.forEach((r) => expect(r.length).toBeGreaterThan(0));
        expect(new Set(roles).size).toBe(roles.length); // all distinct
    });

    it('role framings mention their task type', () => {
        expect(SECOND_ME_PERSONA_ROLES.student.toLowerCase()).toContain('student');
        expect(SECOND_ME_PERSONA_ROLES.writer.toLowerCase()).toContain('writer');
        expect(SECOND_ME_PERSONA_ROLES.executive.toLowerCase()).toContain('executive');
    });
});

describe('buildSecondMePersona', () => {
    it('prefixes the base then appends the persona role', () => {
        for (const persona of SECOND_ME_PERSONAS) {
            const out = buildSecondMePersona(persona);
            expect(out.startsWith(SECOND_ME_PERSONA_BASE)).toBe(true);
            expect(out).toContain(SECOND_ME_PERSONA_ROLES[persona]);
            // Base + single space + role — no double space, no truncation.
            expect(out).toBe(`${SECOND_ME_PERSONA_BASE} ${SECOND_ME_PERSONA_ROLES[persona]}`);
        }
    });

    it('produces distinct instructions per persona', () => {
        const all = SECOND_ME_PERSONAS.map((p) => buildSecondMePersona(p));
        expect(new Set(all).size).toBe(all.length);
    });

    it('is pure/deterministic — same input, same output', () => {
        expect(buildSecondMePersona('writer')).toBe(buildSecondMePersona('writer'));
    });

    it('throws on an unknown persona (runtime safety net for bad casts)', () => {
        expect(() => buildSecondMePersona('wizard' as unknown as SecondMePersona)).toThrow(
            /unknown persona "wizard"/
        );
    });
});

describe('SECOND_ME_PERSONA (default)', () => {
    it('equals the writer-lens build (matches skill-profile default persona)', () => {
        expect(SECOND_ME_PERSONA).toBe(buildSecondMePersona('writer'));
    });

    it('carries the base trust-boundary invariants', () => {
        expect(SECOND_ME_PERSONA).toContain('writing_md');
        expect(SECOND_ME_PERSONA.toLowerCase()).toContain('delegable mode');
    });
});

describe('re-exported persona list', () => {
    it('re-exports the canonical SECOND_ME_PERSONAS', () => {
        expect(SECOND_ME_PERSONAS).toEqual(['student', 'writer', 'executive']);
    });
});
