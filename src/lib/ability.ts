import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import type { MongoAbility } from '@casl/ability';
import type { User } from '@/lib/server-auth';

/**
 * CASL access-control layer.
 *
 * Centralizes ownership rules so IDOR protection is defined ONCE and enforced
 * at the query layer (via @casl/mongoose `accessibleBy`), instead of relying on
 * every route author to remember to add a `userId` filter. This structurally
 * prevents the `get_my_chats`-style IDOR class the repo kept hitting.
 *
 * Actions and subjects can be extended as new owned resources are added.
 */
export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';

// Subjects map 1:1 to Mongoose model names.
export type Subject =
  | 'SheetSession'
  | 'SheetChat'
  | 'SheetConversation'
  | 'ResearchChat'
  | 'all';

// Loosely-typed MongoAbility: subjects are the model-name strings above and
// conditions are plain Mongo query objects (AnyMongoAbility). This matches the
// standard @casl/mongoose integration and lets `accessibleBy` inject the
// ownership filter at the query layer.
export type AppAbility = MongoAbility<[Action, Subject]>;

/**
 * Build the ability for a given authenticated user.
 * A user may only read/update/delete resources whose `userId` equals their id.
 * They may always create new resources (ownership is stamped on create).
 */
export function defineAbilityFor(user: User | null): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(createMongoAbility);
  // Cast to a permissive signature so ownership conditions (`{ userId }`) are
  // accepted regardless of the subject; correctness is enforced at runtime.
  const can = builder.can as (
    action: Action | Action[],
    subject: Subject,
    conditions?: Record<string, unknown>,
  ) => void;

  if (user) {
    const uid = String(user._id || user.id);

    // Owner-scoped access to every user-owned resource.
    can(['read', 'update', 'delete'], 'SheetSession', { userId: uid });
    can(['read', 'update', 'delete'], 'SheetChat', { userId: uid });
    can(['read', 'update', 'delete'], 'ResearchChat', { userId: uid });

    // Conversations are owned transitively via their session; scope directly
    // once a `userId` is denormalized onto the document, otherwise gate in-route.
    can(['read', 'update', 'delete'], 'SheetConversation', { userId: uid });

    // Anyone authenticated may create; ownership is set at creation time.
    can('create', 'all');
  }

  return builder.build();
}
