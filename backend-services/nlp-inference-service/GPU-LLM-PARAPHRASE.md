# GPU LLM Paraphrase Backend (optional)

This service ships with **two** interchangeable paraphrase backends. Pick one
with the `PARAPHRASE_BACKEND` environment variable — no code changes needed.

| Backend         | `PARAPHRASE_BACKEND` | Model                                    | Hardware        | Latency / paraphrase |
| --------------- | -------------------- | ---------------------------------------- | --------------- | -------------------- |
| CTranslate2 T5  | `ctranslate2` (default) | humarin/chatgpt_paraphraser_on_T5_base (INT8) | CPU, ~2 GB RAM  | ~300–600 ms          |
| GPU LLM         | `llm`                | Phi-4-mini or Qwen3-4B (Q4_K_M GGUF)     | 8 GB GPU        | ~80–120 ms           |

The default (`ctranslate2`) requires no GPU and is unchanged. The `llm` backend
is opt-in: it calls an OpenAI-compatible chat server (llama.cpp `llama-server`,
Ollama, vLLM, or TGI) that you run alongside this service.

Both backends implement the same
`generate_paraphrases(text, mode, num_variants, language)` signature, so the
HTTP route (`routes/paraphrase.py`) and the socket handler (`socket_app.py`)
work identically with either one.

---

## 1. Download a GGUF model

Use a small instruct model quantized to `Q4_K_M` (fits comfortably in 8 GB VRAM).

```bash
# Phi-4-mini (~2.5 GB, English-strong)
huggingface-cli download microsoft/Phi-4-mini-instruct-gguf \
  Phi-4-mini-instruct-Q4_K_M.gguf --local-dir ./models/llm

# OR Qwen3-4B (~2.6 GB, natively multilingual — better for non-English)
huggingface-cli download Qwen/Qwen3-4B-GGUF \
  Qwen3-4B-Q4_K_M.gguf --local-dir ./models/llm
```

> Multilingual note: with the `llm` backend the model handles other languages
> directly (we instruct it to reply in the input language), so the NLLB pivot
> used by the CTranslate2 path is **not** required. Qwen3-4B is the better pick
> if you serve many non-English users.

---

## 2. Serve it with llama.cpp (full GPU offload)

`-ngl 99` offloads all layers to the GPU. The server exposes an
OpenAI-compatible API. **Use port 8081** — the NLP service itself uses 8080.

```bash
# Phi-4-mini
llama-server \
  -m ./models/llm/Phi-4-mini-instruct-Q4_K_M.gguf \
  -ngl 99 \
  --alias phi-4-mini \
  --host 0.0.0.0 --port 8081 \
  -c 4096

# Qwen3-4B
llama-server \
  -m ./models/llm/Qwen3-4B-Q4_K_M.gguf \
  -ngl 99 \
  --alias qwen3-4b \
  --host 0.0.0.0 --port 8081 \
  -c 4096
```

Verify it is up:

```bash
curl http://localhost:8081/v1/models
```

**Ollama alternative:** `ollama pull qwen3:4b && ollama serve` (listens on
11434) — then set `LLM_SERVER_URL=http://localhost:11434/v1` and
`LLM_MODEL=qwen3:4b`.

---

## 3. Point the NLP service at it

Set these environment variables for the NLP service (the `--alias` /
model tag must match `LLM_MODEL`):

```bash
export PARAPHRASE_BACKEND=llm
export LLM_SERVER_URL=http://localhost:8081/v1   # llama-server default here
export LLM_MODEL=phi-4-mini                       # or qwen3-4b
export LLM_TIMEOUT=30
```

Then start the NLP service as usual:

```bash
uvicorn main:app --host 0.0.0.0 --port 8080 --workers 1
```

To go back to the CPU path, unset `PARAPHRASE_BACKEND` (or set it to
`ctranslate2`) and restart.

---

## 4. Docker (GPU)

Run the LLM server as a **separate GPU container** and keep the NLP service on
CPU. Example with the official llama.cpp CUDA image:

```bash
# GPU LLM server (needs nvidia-container-toolkit)
docker run -d --name llm-server --gpus all \
  -p 8081:8081 \
  -v "$(pwd)/models/llm:/models" \
  ghcr.io/ggml-org/llama.cpp:server-cuda \
  -m /models/Phi-4-mini-instruct-Q4_K_M.gguf \
  -ngl 99 --alias phi-4-mini --host 0.0.0.0 --port 8081 -c 4096
```

Then start the NLP container (see `setup-docker-files.sh`) with the env vars
from step 3. If both run in Docker on the same host network, use
`--network host` or set `LLM_SERVER_URL` to the LLM container's name, e.g.
`http://llm-server:8081/v1`.

---

## 5. Config reference (`services/config.py`)

| Env var                 | Default                     | Purpose                                   |
| ----------------------- | --------------------------- | ----------------------------------------- |
| `PARAPHRASE_BACKEND`    | `ctranslate2`               | `ctranslate2` (CPU T5) or `llm` (GPU LLM) |
| `LLM_SERVER_URL`        | `http://localhost:8081/v1`  | OpenAI-compatible base URL (incl. `/v1`)  |
| `LLM_MODEL`             | `phi-4-mini`                | Model alias/tag the server exposes        |
| `LLM_TIMEOUT`           | `30`                        | Per-request timeout (seconds)             |
| `PARAPHRASE_MODEL_PATH` | `/models/paraphrase`        | CTranslate2 paraphrase model dir          |
| `TRANSLATION_MODEL_PATH`| `/models/translation`       | CTranslate2 NLLB translation model dir    |

The `llm` backend adds one dependency, `requests`, already added to
`requirements.txt`.
