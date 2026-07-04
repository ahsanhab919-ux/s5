import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import dbConnect from '@/lib/dbConnect';
import SecondMeIdentity from '@/models/SecondMeIdentity';
import { getSkillProfile, putSkillProfile, SkillProfileError } from '@/lib/second-me/skill-profile';
import { getReputation } from '@/lib/second-me/reputation';
import { listCustody } from '@/lib/second-me/key-custody';
import { SECOND_ME_PERSONAS } from '@/models/SecondMeSkillProfile';

/**
 * /api/second-me/profile — the Second Me profile snapshot + skill-profile editor.
 *
 * This is the thin HTTP shell for the Step 6 profile UI. It composes the pieces
 * built in Steps 1–4 into ONE read model, and lets the user edit the one part
 * that is user-editable (the skill profile). Auth + shape only — all logic lives
 * in the second-me services so they stay unit-testable without HTTP.
 *
 * GET  → { identity, skillProfile, reputation, keys, personas }
 *        identity/skillProfile/keys are READ-ONLY here and NEVER contain secrets:
 *        identity is the public key summary, keys is the presence-only custody
 *        list (provider labels, never the sealed material or plaintext).
 * PUT  → body = { personas, defaultPersona, focusAreas } (validated by the
 *        skill-profile service; SkillProfileError ⇒ 400). Returns the saved
 *        skill profile.
 *
 * SECURITY: no endpoint here ever returns key plaintext or the sealed envelope.
 * listCustody returns non-secret views by construction. Identity exposes only
 * the PUBLIC key + fingerprint.
 *
 * Spec: SECOND-ME-SPEC.md §6 (profile UI). Mirrors src/app/api/re-educator/route.ts.
 */

/** Public, non-secret view of the identity row. Never includes private material. */
function identityView(doc: {
    keyId: string;
    publicKey: string;
    revoked: boolean;
    lettaAgentId: string;
} | null) {
    if (!doc) return null;
    return {
        keyId: doc.keyId,
        publicKey: doc.publicKey, // the PUBLIC half only — safe to surface
        revoked: doc.revoked,
        lettaAgentId: doc.lettaAgentId,
    };
}

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = String(user._id || user.id);

        await dbConnect();
        // Read-only lookups. We intentionally do NOT provision an identity here
        // (that would create a Letta agent on a GET) — the UI shows "not set up
        // yet" when identity is null and provisioning happens on the acting path.
        const identityDoc = await SecondMeIdentity.findOne({ userId });
        const skillProfile = await getSkillProfile(userId);
        const reputation = await getReputation(userId);
        const keys = await listCustody(userId);

        return NextResponse.json({
            identity: identityView(identityDoc),
            skillProfile: skillProfile
                ? {
                      personas: skillProfile.personas,
                      defaultPersona: skillProfile.defaultPersona,
                      focusAreas: skillProfile.focusAreas,
                  }
                : null,
            reputation,
            keys, // presence-only custody views (provider labels, no secrets)
            personas: SECOND_ME_PERSONAS, // enum the editor renders
        });
    } catch (error) {
        console.error('Error reading Second Me profile:', error);
        return NextResponse.json({ error: 'Failed to read Second Me profile.' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = String(user._id || user.id);

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Body must be valid JSON.' }, { status: 400 });
        }

        // Validation lives in the service (parseSkillProfile) — SkillProfileError
        // ⇒ 400 with the specific message, mirroring the re-educator route.
        const saved = await putSkillProfile(userId, body);

        return NextResponse.json({
            skillProfile: {
                personas: saved.personas,
                defaultPersona: saved.defaultPersona,
                focusAreas: saved.focusAreas,
            },
        });
    } catch (error) {
        if (error instanceof SkillProfileError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('Error saving Second Me skill profile:', error);
        return NextResponse.json({ error: 'Failed to save skill profile.' }, { status: 500 });
    }
}
