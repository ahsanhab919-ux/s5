import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import {
    storeByokKey,
    deleteByokKey,
    KeyCustodyError,
} from '@/lib/second-me/key-custody';
import { isByokProvider } from '@/lib/re-educator/byok';

/**
 * /api/second-me/keys — store / revoke a user's PERSISTED BYOK key.
 *
 * Unlike the Re-educator's per-request BYOK (where the key lives only for one
 * run and is never stored), a Second Me can hold a key at rest so delegated work
 * reuses it. This route is the write side of the Step 4 custody store.
 *
 * POST   → body = { provider }, key in the `x-second-me-key` header (preferred,
 *          keeps it out of any captured body) or `apiKey` in the body as a
 *          fallback. The key is SEALED server-side and only a non-secret view is
 *          returned. KeyCustodyError ⇒ 400.
 * DELETE → body = { provider }. Revokes the stored key. Idempotent.
 *
 * SECURITY: the plaintext key is read here, handed straight to storeByokKey
 * (which seals BEFORE any DB write), and NEVER logged or echoed. The response
 * carries only { userId, purpose, provider, present } — never the key.
 *
 * Spec: SECOND-ME-SPEC.md §6, src/lib/second-me/key-custody.ts.
 */

/** Read the plaintext key: header wins (out of captured bodies), body fallback. */
function readKey(body: unknown, request: Request): string | undefined {
    const headerKey = request.headers.get('x-second-me-key') ?? undefined;
    const bodyKey =
        body && typeof body === 'object' && typeof (body as Record<string, unknown>).apiKey === 'string'
            ? ((body as Record<string, unknown>).apiKey as string)
            : undefined;
    return headerKey || bodyKey;
}

function readProvider(body: unknown): string | undefined {
    const p = body && typeof body === 'object' ? (body as Record<string, unknown>).provider : undefined;
    return typeof p === 'string' ? p : undefined;
}

export async function POST(request: Request) {
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

        const provider = readProvider(body);
        const apiKey = readKey(body, request);
        if (!provider) {
            return NextResponse.json({ error: 'A "provider" is required.' }, { status: 400 });
        }
        if (!apiKey) {
            return NextResponse.json({ error: 'An API key is required.' }, { status: 400 });
        }

        // storeByokKey validates provider + key, seals, and upserts. Returns a
        // non-secret view. KeyCustodyError (bad input / vault unavailable) ⇒ 400.
        const view = await storeByokKey(userId, provider, apiKey);
        return NextResponse.json({ key: view });
    } catch (error) {
        if (error instanceof KeyCustodyError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('Error storing Second Me key:', error);
        return NextResponse.json({ error: 'Failed to store key.' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
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

        const provider = readProvider(body);
        if (!isByokProvider(provider)) {
            return NextResponse.json({ error: 'A valid "provider" is required.' }, { status: 400 });
        }

        const removed = await deleteByokKey(userId, provider);
        return NextResponse.json({ removed });
    } catch (error) {
        console.error('Error deleting Second Me key:', error);
        return NextResponse.json({ error: 'Failed to delete key.' }, { status: 500 });
    }
}
