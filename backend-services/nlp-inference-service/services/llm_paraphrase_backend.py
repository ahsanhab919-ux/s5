"""
GPU LLM paraphrase backend (llama.cpp / OpenAI-compatible server).

This is an OPTIONAL, higher-quality alternative to the default CTranslate2 T5
path. When a GPU is available, run a small instruct model (Phi-4-mini or
Qwen3-4B) fully offloaded via llama.cpp's server (`-ngl 99`) and point this
backend at it. Latency drops from ~300-600 ms (CPU T5) to ~80-120 ms per
paraphrase, and multilingual quality improves enough to make the NLLB pivot
optional (Qwen3 is natively multilingual).

Selection is controlled by the `PARAPHRASE_BACKEND` env var (see config.py):
  - "ctranslate2" (default): the existing humarin/T5 INT8 CPU path.
  - "llm": this backend, calling a llama-server at LLM_SERVER_URL.

The backend speaks the OpenAI-compatible Chat Completions API that
`llama-server` exposes, so it also works unchanged against Ollama, vLLM, or
TGI's OpenAI shim — only LLM_SERVER_URL / LLM_MODEL need to change.
"""

import logging
from typing import List

import requests

logger = logging.getLogger(__name__)


# Per-mode system prompts. Rewriting behavior is expressed in the prompt here
# (unlike the T5 path where it lives in decoding params), because instruct LLMs
# follow instructions directly.
_MODE_PROMPTS = {
    "standard": (
        "You are a paraphrasing engine. Rewrite the user's text so it keeps the "
        "exact same meaning but uses different words and sentence structure. "
        "Return ONLY the rewritten text, with no preamble, quotes, or notes."
    ),
    "fluency": (
        "You are an editor. Rewrite the user's text to fix grammar and improve "
        "flow while preserving the meaning. Return ONLY the rewritten text."
    ),
    "formal": (
        "You are an editor. Rewrite the user's text in a professional, academic "
        "tone while preserving the meaning. Return ONLY the rewritten text."
    ),
    "creative": (
        "You are a creative paraphrasing engine. Rewrite the user's text with "
        "fresh, varied vocabulary and phrasing while preserving the meaning. "
        "Return ONLY the rewritten text."
    ),
}


class LLMParaphraseBackend:
    """
    Thin HTTP client for a llama.cpp (or OpenAI-compatible) chat server.

    Kept API-compatible with ParaphraseEngine.generate_paraphrases so the route
    layer can use either backend interchangeably.
    """

    def __init__(
        self,
        server_url: str,
        model: str,
        timeout: float = 30.0,
        mock_mode: bool = False,
    ):
        # server_url is the base, e.g. "http://llm:8080/v1"
        self.endpoint = server_url.rstrip("/") + "/chat/completions"
        self.model = model
        self.timeout = timeout
        self.mock_mode = mock_mode

    def _one_variant(self, text: str, mode: str, temperature: float) -> str:
        system_prompt = _MODE_PROMPTS.get(mode, _MODE_PROMPTS["standard"])
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            "temperature": temperature,
            "top_p": 0.95,
            "max_tokens": 512,
            "stream": False,
        }
        resp = requests.post(self.endpoint, json=payload, timeout=self.timeout)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()

    def generate_paraphrases(
        self,
        text: str,
        mode: str = "standard",
        num_variants: int = 1,
        language: str = "English",
    ) -> List[str]:
        """
        Generate `num_variants` paraphrases. Multilingual is handled natively by
        the model (no NLLB pivot needed): we simply instruct it to keep the
        input language.
        """
        if self.mock_mode:
            logger.info(f"Generating MOCK LLM paraphrase (Lang: {language}).")
            return [f"[MOCK LLM {mode} - {language}] {text}"][:num_variants]

        if not text:
            return []

        # Ask the model to preserve the input language when it isn't English.
        user_text = text
        if language and language.lower() not in ["english", "en", "us", "uk"]:
            user_text = f"[Reply in {language}]\n{text}"

        # Deterministic-ish for standard modes; warmer for creative. Distinct
        # variants come from a rising temperature per variant.
        base_temp = 0.9 if mode == "creative" else 0.4

        variants: List[str] = []
        for i in range(max(1, num_variants)):
            temp = min(base_temp + i * 0.15, 1.2)
            try:
                variants.append(self._one_variant(user_text, mode, temp))
            except Exception as e:
                logger.error(f"❌ LLM paraphrase request failed: {e}")
                # Fail soft: return what we have (route layer can fall back).
                break
        return variants

    def health(self) -> bool:
        """Quick reachability check against the server's models endpoint."""
        try:
            base = self.endpoint.rsplit("/chat/completions", 1)[0]
            r = requests.get(base + "/models", timeout=5)
            return r.ok
        except Exception:
            return False
