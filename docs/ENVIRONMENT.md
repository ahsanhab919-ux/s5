# Environment Variables

This document inventories every environment variable required to run Shothik v4 across all three deploy targets. It is the source of truth; the committed `.env.*.example` files are the templates you copy from.

> Security: variables prefixed with `NEXT_PUBLIC_` are shipped to the browser bundle. **Never** put secrets (private API keys, DB credentials, session secrets) behind that prefix.

---

## 1. Frontend — `.env.local`

Copied from [`.env.example`](../.env.example).

### Core app URLs
| Variable | Example | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` in prod |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public site origin |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend API base |
| `NEXT_PUBLIC_API_URL_WITH_PREFIX` | `http://localhost:5000/api/v1` | Versioned API base |

### Database (server-side only)
| Variable | Example |
| --- | --- |
| `MONGODB_URI` | `mongodb://localhost:27017/shothik` |

### Backend service URLs
| Variable | Example |
| --- | --- |
| `NEXT_PUBLIC_PARAPHRASE_API_URL` | `http://localhost:8080/api/v1` |
| `NEXT_PUBLIC_PARAPHRASE_SOCKET_URL` | `http://localhost:8080` |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:5000` |

### Feature redirect prefixes
- `NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX`
- `NEXT_PUBLIC_PARAPHRASE_REDIRECT_PREFIX`
- `NEXT_PUBLIC_PLAGIARISM_REDIRECT_PREFIX`
- `NEXT_PUBLIC_RESEARCH_REDIRECT_PREFIX`
- `NEXT_PUBLIC_SHEET_REDIRECT_PREFIX`
- `NEXT_PUBLIC_SLIDE_REDIRECT_PREFIX`

### Auth (Google OAuth)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### Payments
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_RAZOR_KEY`
- `NEXT_PUBLIC_PAYMENT_SYSTEM_URL`

### Analytics / marketing pixels
- `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`
- `NEXT_PUBLIC_FB_PIXEL_ID`

### YouTube integration
- `NEXT_PUBLIC_YOUTUBE_API_KEY`
- `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`

### Geolocation
- `GOOGLE_GEOLOCATION_KEY` — server-side, **preferred**
- `NEXT_PUBLIC_GOOGLE_GEOLOCATION_KEY` — avoid (exposed to client)

### Integrations
- `ZOHO_WEBHOOK_URL`

### Letta (WRITING.md persistent memory — Phase 1)
| Variable | Default | Notes |
| --- | --- | --- |
| `LETTA_BASE_URL` | `http://localhost:8283` | Self-hosted Letta server |
| `LETTA_API_KEY` | _(blank)_ | Required when Letta `SECURE=true` |
| `LETTA_MODEL` | `openai/gpt-4o-mini` | `provider/model-name` |
| `LETTA_EMBEDDING` | `openai/text-embedding-3-small` | `provider/model-name` |

Under BYOK (Phase 2) the model/embedding pair is overridden per-user at agent creation.

---

## 2. Next.js web (production) — `.env.web.prod`

Copied from [`.env.web.prod.example`](../.env.web.prod.example). Deployed via `scripts/deploy-prod.sh`.

| Variable | Example | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | |
| `PORT` | `3000` | |
| `NEXT_TELEMETRY_DISABLED` | `1` | |
| `NLP_SERVICE_URL` | `http://nlp-service:8080` | Compose service name |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` | Public origin |
| `NEXTAUTH_URL` | `https://<your-domain>` | Must match public origin |
| `NEXTAUTH_SECRET` | _(random)_ | Generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | | Cloudinary account |
| `CLOUDINARY_API_KEY` | | Server-side only |
| `CLOUDINARY_API_SECRET` | | Server-side only |

---

## 3. NLP inference service (production) — `.env.nlp.prod`

Copied from [`.env.nlp.prod.example`](../.env.nlp.prod.example). Var names must match `backend-services/nlp-inference-service/services/config.py`.

| Variable | Example | Notes |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | `https://<your-domain>` | Comma-separated CORS origins; must match public site origin |
| `PARAPHRASE_BACKEND` | `ctranslate2` | `ctranslate2` (CPU) or `llm` (GPU via OpenAI-compatible server) |
| `LLM_SERVER_URL` | `http://llm-server:8081/v1` | Required when `PARAPHRASE_BACKEND=llm`; **must** include `/v1` |
| `LLM_MODEL` | `phi-4-mini` | |
| `LLM_TIMEOUT` | `30` | Seconds |
| `PARAPHRASE_MODEL_PATH` | `/models/paraphrase` | Mounted volume from `docker-compose.prod.yml` |
| `TRANSLATION_MODEL_PATH` | `/models/translation` | Mounted volume from `docker-compose.prod.yml` |
| `PYTHON_ENV` | `production` | `development` locally |

---

## Secret hygiene

1. Real `.env.*.prod` files are `.gitignore`d — only `*.example` templates are committed.
2. Rotate `NEXTAUTH_SECRET`, `MONGODB_URI` credentials, and Cloudinary secrets on any suspected compromise.
3. Keep `GOOGLE_GEOLOCATION_KEY` server-side; skip the `NEXT_PUBLIC_` variant unless a client-side call is unavoidable.
4. Store production values in the deploy host's secret manager (VPS `.env.*.prod` file with `chmod 600`, or a KMS-backed store) — never in chat, PRs, or logs.

## Adding a new variable

1. Add it to the appropriate `.env.*.example` with a comment describing its purpose and safe default.
2. Add a row/bullet to this document in the matching section.
3. If it is consumed at build time by Next.js, remember it needs to be present at build — not just at runtime.
4. Reference the PR/issue that introduced it in the commit message.
