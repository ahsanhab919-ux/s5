# Stage 1: Build dependencies & Models
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch (CPU) - Expensive Layer
# We install globally in the builder
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir \
    torch==2.1.0 \
    torchvision==0.16.0 \
    torchaudio==2.1.0 \
    --index-url https://download.pytorch.org/whl/cpu

# Install Dependencies (Globally)
COPY requirements-base.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements-base.txt

# Download Models
COPY scripts /build/scripts
# T5 disabled temporarily
# RUN python /build/scripts/download_and_convert_models.py --step t5
RUN python -m spacy download en_core_web_sm

# Validating Model Paths
RUN mkdir -p /models/paraphrase /models/translation /models/vectors /models/stanza_resources /models/fasttext

# Stage 2: Runtime (Slim)
FROM python:3.11-slim

WORKDIR /app

# Runtime System Deps
RUN apt-get update && apt-get install -y \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder (Standard Location)
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy Models
COPY --from=builder /models /models

# Copy App Code
COPY backend-services/nlp-inference-service .

ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV TRANSFORMERS_OFFLINE=1
ENV HF_HUB_OFFLINE=1

EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
