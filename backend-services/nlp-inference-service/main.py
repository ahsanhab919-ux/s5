
import logging
from contextlib import asynccontextmanager
import os
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.model_loader import ModelLoader
from routes import paraphrase
from socket_app import socket_app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("nlp_service")

# Global dict to hold loaded models
models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for loading ML models during startup.
    This prevents cold-start latency for individual requests.
    """
    logger.info("🚀 Starting NLP Inference Service...")
    
    # Placeholder for model loading logic
    try:
        # We trigger the loaders here to warm up the cache
        # Note: We use the path inside the container
        # For local dev without docker, these paths might fail unless mapped
        logger.info("  - Warming up Paraphrase Model...")
        ModelLoader.load_ctranslate2_model("/models/paraphrase")
        
        logger.info("  - Warming up SpaCy...")
        ModelLoader.load_spacy_model("en_core_web_sm")
        
        logger.info("✅ All models loaded successfully.")
    except Exception as e:
        logger.error(f"❌ Critical Error loading models: {e}")
        # In production, we might want to exit here if models are critical
    
    yield
    
    # Cleanup
    logger.info("🛑 Shutting down NLP Service. Clearing memory...")
    models.clear()

app = FastAPI(
    title="Shothik NLP Inference Service",
    description="High-performance CTranslate2/FastAPI Paraphrasing Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Secure CORS policy by loading allowed origins from an environment variable.
# This prevents unauthorized domains from making requests to the API.
# Example: ALLOWED_ORIGINS="http://localhost:3000,https://your-frontend.com"
ALLOWED_ORIGINS_STR = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS: List[str] = [
    origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",") if origin.strip()
]

# In development, you might want to uncomment the following for easier local testing:
# if not ALLOWED_ORIGINS and os.getenv("PYTHON_ENV") == "development":
#     ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "nlp-inference"}

# Include Routers
app.include_router(paraphrase.router, prefix="/api/v1", tags=["paraphrase"])

# Mount Socket.IO
app.mount("/", socket_app)
