"""
Runtime configuration for the paraphrase service.

Controls which paraphrase backend is used and how the optional GPU LLM server
is reached. All values come from environment variables so the same image can
run CPU-only (default) or GPU-accelerated without code changes.
"""

import os

# Which paraphrase backend to use:
#   "ctranslate2" (default) -> humarin/T5 INT8 on CPU (~2 GB RAM, no GPU needed)
#   "llm"                    -> small instruct model via llama.cpp GPU server
PARAPHRASE_BACKEND = os.getenv("PARAPHRASE_BACKEND", "ctranslate2").lower()

# --- LLM backend settings (only used when PARAPHRASE_BACKEND == "llm") ---
# Base URL of the OpenAI-compatible server (llama.cpp `llama-server`, Ollama,
# vLLM, or TGI). Include the /v1 suffix.
# NOTE: the NLP service itself listens on 8080, so the LLM server must use a
# different port (default 8081) to avoid a collision.
LLM_SERVER_URL = os.getenv("LLM_SERVER_URL", "http://localhost:8081/v1")

# Model name/alias the server exposes. For llama-server this is the value of
# its --alias flag; for Ollama it's the pulled tag (e.g. "qwen3:4b").
LLM_MODEL = os.getenv("LLM_MODEL", "phi-4-mini")

# Request timeout (seconds) for a single generation.
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "30"))

# Model directories (existing CTranslate2 path).
PARAPHRASE_MODEL_PATH = os.getenv("PARAPHRASE_MODEL_PATH", "/models/paraphrase")
TRANSLATION_MODEL_PATH = os.getenv("TRANSLATION_MODEL_PATH", "/models/translation")
