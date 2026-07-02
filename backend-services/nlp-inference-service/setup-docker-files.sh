#!/bin/bash
set -e

# Configuration
IMAGE_NAME="nlp-inference-dev"
CONTAINER_NAME="nlp-dev"
HOST_PORT=8080
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting NLP Service Setup..."

# 1. Stop existing container if running
if [ "$(docker ps -aq -f name=${CONTAINER_NAME})" ]; then
    echo "🛑 Stopping existing container..."
    docker rm -f ${CONTAINER_NAME}
fi

# 2. Build the lightweight image (skips downloads)
echo "🔨 Building Docker Image (Dev Mode)..."
docker build -t ${IMAGE_NAME} "${PROJECT_DIR}"

# 3. Clean local models dir permissions (if re-running)
echo "🧹 Ensuring model directories exist..."
mkdir -p "${PROJECT_DIR}/models/paraphrase"
mkdir -p "${PROJECT_DIR}/models/translation" 
mkdir -p "${PROJECT_DIR}/models/stanza_resources"

# 4. Start Container with Volume Mount
echo "📦 Starting Container..."
docker run -d \
  --name ${CONTAINER_NAME} \
  -p ${HOST_PORT}:8080 \
  -v "${PROJECT_DIR}:/app" \
  -v "${PROJECT_DIR}/models:/models" \
  ${IMAGE_NAME} \
  sleep infinity

echo "✅ Container started with ID: $(docker ps -q -f name=${CONTAINER_NAME})"

# 5. Install Dependencies (Optimized for CPU) inside container
echo "📥 Installing Dependencies inside container (This may take time)..."
# Using the CPU-specific index for PyTorch to avoid massive downloads
docker exec -i ${CONTAINER_NAME} bash -c "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt && pip install ctranslate2 transformers stanza sentencepiece"

# 6. Download Models inside container
echo "🤖 Downloading AI Models (Automated)..."
echo "   - Step 1: T5 (Paraphrasing)"
docker exec -i ${CONTAINER_NAME} python scripts/download_and_convert_models.py --step t5

echo "   - Step 2: NLLB (Translation)"
docker exec -i ${CONTAINER_NAME} python scripts/download_and_convert_models.py --step nllb

echo "   - Step 3: Stanza (Entities)"
# Stanza is optional but recommended
docker exec -i ${CONTAINER_NAME} python scripts/download_and_convert_models.py --step stanza

# 7. Start the Service
echo "🚀 Models Ready. Starting Server..."
# We run uvicorn in detached mode or attached? 
# The user script should probably just setup the environment.
# But let's start it in background inside proper CMD override or exec.
# We'll replace the 'sleep infinity' with the actual server.
# But uvicorn blocks. So let's tell user it's ready.

# Actually, users usually want 'setup' to end with 'running'.
# We can't replace PID 1 easily without restart.
# So we kill the sleep and start uvicorn?
# Easier: Just run uvicorn via exec in detached.
docker exec -d ${CONTAINER_NAME} uvicorn main:app --host 0.0.0.0 --port 8080 --workers 1

echo "🎉 Service is LIVE at http://localhost:${HOST_PORT}"
echo "   You can view logs with: docker logs -f ${CONTAINER_NAME}"
