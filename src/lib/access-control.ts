import { getAuthenticatedUser, type User } from '@/lib/server-auth';
import { defineAbilityFor, type AppAbility } from '@/lib/ability';

/**
 * Per-request access-control context.
 *
 * Usage in a route:
 *
 *   const ctx = await getAccessContext();
 *   if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   const { user, ability } = ctx;
 *
 *   // Ownership filter is injected automatically at the query layer:
 *   const chats = await SheetChat.accessibleBy(ability, 'read').sort({ updatedAt: -1 });
 *
 * This makes the `get_my_chats`-style IDOR structurally impossible: a route can
 * no longer accidentally return another user's documents, because the ownership
 * constraint lives in the ability rules, not in each route's hand-written query.
 */
export interface AccessContext {
  user: User;
  ability: AppAbility;
}

export async function getAccessContext(): Promise<AccessContext | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  return { user, ability: defineAbilityFor(user) };
}

/** Convenience: the current user's id as a string, for stamping ownership on create. */
export function ownerId(user: User): string {
  return String(user._id || user.id);
}
