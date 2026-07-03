# WRITING.md — Phase 1 keystone (Letta-backed persistent context)

WRITING.md is the user's living style guide (voice, audience, terminology,
goals). It is the foundation of the product vision: Twin reads it before every
draft, and later writes back to it as it learns. This is Phase 1's keystone —
everything downstream (Twin, Second Me, the Agent Work Protocol) builds on it.

## Architecture (adopt Letta, build the WRITING.md convention on top)

- **Storage:** each user gets one **Letta** agent. Their WRITING.md lives as a
  human-readable **core-memory block** (`label: "writing_md"`) on that agent.
  This gives us versioning, auditability, self-editing by Twin, and a clean
  BYOK path — without building a memory OS ourselves.
- **Vector store:** Postgres + pgvector (Letta's default). No separate Chroma.
- **App mirror:** MongoDB `WritingProfile` stores only the pointer
  (`userId → lettaAgentId`) + light metadata, so the app can find a user's
  agent without a Letta round-trip.

See `MEMORY-STACK-EVALUATION.md` for the full build-vs-adopt reasoning.

## Files added

| File | Purpose |
|---|---|
| `src/lib/letta.ts` | Letta client + WRITING.md service (create agent, get/save block) |
| `src/lib/writingProfile.ts` | get-or-create a user's profile + Letta agent |
| `src/models/WritingProfile.ts` | MongoDB mirror (userId → lettaAgentId) |
| `src/app/api/writing-md/route.ts` | `GET` (read) + `PATCH` (save) WRITING.md, auth-guarded |
| `src/components/tools/writing-studio/components/WritingMdPanel.jsx` | Editor UI (Context tab in Writing Studio) |
| `docker-compose.letta.yml` | Self-hosted Letta + pgvector |

## Local setup

1. **Start Letta + pgvector:**
   ```bash
   export OPENAI_API_KEY=sk-...        # provider key for the Letta server
   docker compose -f docker-compose.letta.yml up -d
   # Letta REST API -> http://localhost:8283
   ```

2. **Configure the app** (`.env.local`):
   ```
   LETTA_BASE_URL=http://localhost:8283
   LETTA_API_KEY=                       # only if the server runs with SECURE=true
   LETTA_MODEL=openai/gpt-4o-mini
   LETTA_EMBEDDING=openai/text-embedding-3-small
   ```

3. **Install + run:**
   ```bash
   npm install
   npm run dev
   ```

4. Open **Writing Studio → Context tab**. The first load provisions the user's
   Letta agent with a starter WRITING.md; edits are saved back to the block.

## API

- `GET /api/writing-md` → `{ content, limit, agentId, updatedAt }`
  (creates the agent on first call)
- `PATCH /api/writing-md` with `{ content }` → saves; `413` if over the
  character limit.

Both routes require an authenticated user (`jwt_token` cookie), matching the
existing route convention.

## Next steps (Phase 1 → 2)

- **Twin read loop:** inject WRITING.md into paraphrase/humanize/writing prompts.
- **Twin write loop:** let Twin propose WRITING.md updates via Letta memory tools.
- **BYOK (Phase 2):** pass the user's own model/embedding handle + key at agent
  creation (fields already threaded through `createWritingAgent`).
