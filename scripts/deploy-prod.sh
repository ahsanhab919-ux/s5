#!/usr/bin/env bash
# Pull latest images from GCR and (re)start the production stack on the VPS.
# Usage: GCP_PROJECT_ID=my-proj IMAGE_TAG=<sha> ./scripts/deploy-prod.sh
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
WEB_HEALTH_URL="${WEB_HEALTH_URL:-http://localhost:3000}"
NLP_HEALTH_URL="${NLP_HEALTH_URL:-http://localhost:8080/health}"

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID (e.g. export GCP_PROJECT_ID=my-project)}"
export IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "==> Authenticating Docker to GCR"
gcloud auth configure-docker gcr.io --quiet

echo "==> Pulling images (project=$GCP_PROJECT_ID tag=$IMAGE_TAG)"
docker compose -f "$COMPOSE_FILE" pull

echo "==> Starting/updating containers"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "==> Pruning old images"
docker image prune -f

echo "==> Waiting for services to become healthy"
sleep 10

check() {
  local name="$1" url="$2"
  if curl -fsS --max-time 10 "$url" >/dev/null 2>&1; then
    echo "OK: $name ($url)"
  else
    echo "FAILED: $name ($url)" >&2
    return 1
  fi
}

rc=0
check "web" "$WEB_HEALTH_URL" || rc=1
check "nlp-service" "$NLP_HEALTH_URL" || rc=1

if [ "$rc" -ne 0 ]; then
  echo "==> Health checks failed. Recent logs:" >&2
  docker compose -f "$COMPOSE_FILE" logs --tail=50
  exit 1
fi

echo "==> Deploy complete."
