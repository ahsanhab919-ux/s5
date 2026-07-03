# Deployment (Hybrid: VPS runtime + GCP Cloud Build)

Shothik deploys as containers on a single-region VPS, while Google Cloud Build
builds and pushes the images. Two images are produced:

- `shothik-web` — Next.js frontend (built from `Dockerfile.web`, standalone output)
- `nlp-inference-service` — FastAPI paraphrase backend (built from root `Dockerfile`)

## Architecture

```
Internet → Caddy (TLS, :80/:443) → web (Next.js :3000)
                                      └→ rewrites /api/paraphrase* → nlp-service :8080 (/api/v1/paraphrase)
```

Models live in a named Docker volume mounted at `/models` so they survive
restarts and deploys.

## Files

| File | Role |
|------|------|
| `Dockerfile.web` | Next.js production image |
| `Dockerfile` | NLP inference service image |
| `docker-compose.prod.yml` | VPS runtime (web + nlp-service + Caddy proxy) |
| `Caddyfile` | Reverse proxy + automatic TLS |
| `cloudbuild.yaml` | Builds & pushes both images (tagged `:$SHORT_SHA` and `:latest`) |
| `scripts/deploy-prod.sh` | Pull images, restart stack, health-check |
| `.env.web.prod.example` / `.env.nlp.prod.example` | Env templates (copy to `.env.*.prod`) |

## One-time setup (on the VPS)

1. Install Docker + Docker Compose plugin and the `gcloud` CLI.
2. Clone the repo, then create the real env files from templates:

   ```bash
   cp .env.web.prod.example .env.web.prod
   cp .env.nlp.prod.example .env.nlp.prod
   # edit both: set <your-domain>, NEXTAUTH_SECRET, ALLOWED_ORIGINS, etc.
   ```

3. Edit `Caddyfile` and replace `<your-domain>` with your real domain.
4. Point a DNS A record for your domain at the VPS public IP (required for TLS).
5. Authenticate Docker to the registry: `gcloud auth configure-docker gcr.io`.
6. Seed the model volume once:

   ```bash
   docker compose -f docker-compose.prod.yml run --rm nlp-service \
     python scripts/download_and_convert_models.py
   ```

## Build pipeline (Cloud Build)

Trigger a build (manually or via a GitHub trigger on push to `main`):

```bash
gcloud builds submit --config cloudbuild.yaml .
```

This produces `gcr.io/$PROJECT_ID/shothik-web` and
`gcr.io/$PROJECT_ID/nlp-inference-service`, each tagged with the commit SHA
and `latest`.

## Deploy (on the VPS)

```bash
export GCP_PROJECT_ID=your-project-id
export IMAGE_TAG=<commit-sha>   # or omit to use :latest
./scripts/deploy-prod.sh
```

The script authenticates to GCR, pulls the tagged images, restarts the stack,
prunes old images, then health-checks `web` (:3000) and `nlp-service`
(`/health` on :8080). It exits non-zero and prints logs if either check fails.

## Environment variables

### Web (`.env.web.prod`)
- `NLP_SERVICE_URL` — in-container backend URL (`http://nlp-service:8080`)
- `NEXT_PUBLIC_SITE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- Cloudinary keys (if used)

### NLP (`.env.nlp.prod`) — names match `services/config.py` + `main.py`
- `ALLOWED_ORIGINS` — comma-separated; MUST include your public origin
- `PARAPHRASE_BACKEND` — `ctranslate2` (CPU default) or `llm` (GPU server)
- `LLM_SERVER_URL`, `LLM_MODEL`, `LLM_TIMEOUT` — only for the `llm` backend
- `PARAPHRASE_MODEL_PATH`, `TRANSLATION_MODEL_PATH` — under `/models`

## Rollback

Re-run the deploy with a previous known-good SHA:

```bash
IMAGE_TAG=<previous-good-sha> ./scripts/deploy-prod.sh
```

## Notes & gotchas

- `next.config.ts` reads `NLP_SERVICE_URL`; it defaults to `127.0.0.1:8080`
  for local dev, which does NOT work between containers — the compose file
  overrides it with the service name.
- The NLP health check has a 60s `start_period` because model warm-up takes
  time on first boot; `web` waits for `nlp-service` to be healthy.
- Real `.env.*.prod` files are git-ignored; only `*.example` templates are tracked.
