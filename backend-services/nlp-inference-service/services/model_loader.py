
import logging
try:
    import ctranslate2
    import transformers
    import stanza
    import fasttext
except ImportError:
    pass
import os
from functools import lru_cache

logger = logging.getLogger(__name__)

class ModelLoader:
    """
    Singleton-style loader for NLP models.
    Designed to manage memory strictly.
    """
    _instances = {}

    @classmethod
    def load_ctranslate2_model(cls, model_path: str, device="cpu"):
        """
        Loads a CTranslate2 Translator (Paraphrase/NLLB).
        Uses 'int8' compute type by default for 4x speedup on CPU.
        """
        if model_path in cls._instances:
            return cls._instances[model_path]
            
        logger.info(f"Loading CTranslate2 model from {model_path}...")
        try:
            # Check if directory exists
            if not os.path.exists(model_path):
                logger.warning(f"⚠️ Model path {model_path} not found. Running in MOCK MODE.")
                instance = {"model": None, "tokenizer": None, "mock": True}
                cls._instances[model_path] = instance
                return instance
                
            model = ctranslate2.Translator(
                model_path, 
                device=device,
                compute_type="int8" # Crucial for speed/RAM
            )
            
            # Load associated tokenizer
            tokenizer = transformers.AutoTokenizer.from_pretrained(model_path)
            
            instance = {"model": model, "tokenizer": tokenizer}
            cls._instances[model_path] = instance
            logger.info("✅ CTranslate2 model loaded.")
            return instance
        except Exception as e:
            logger.error(f"❌ Failed to load CTranslate2 model: {e}")
            logger.warning("⚠️ Falling back to MOCK MODE due to load failure.")
            instance = {"model": None, "tokenizer": None, "mock": True}
            cls._instances[model_path] = instance
            return instance

    @classmethod
    def load_spacy_model(cls, model_name="en_core_web_sm"):
        """
        Loads SpaCy model (Lightweight Entity Recognition).
        """
        if "spacy" in cls._instances:
            return cls._instances["spacy"]
            
        logger.info(f"Loading SpaCy Model: {model_name}...")
        
        try:
            import spacy
        except ImportError:
             logger.warning("⚠️ SpaCy library not found. Running in MOCK MODE.")
             cls._instances["spacy"] = None
             return None

        try:
            nlp = spacy.load(model_name)
            cls._instances["spacy"] = nlp
            logger.info("✅ SpaCy Model loaded.")
            return nlp
        except Exception as e:
            logger.error(f"❌ Failed to load SpaCy model: {e}")
            logger.warning("⚠️ SpaCy load failed. Falling back to Mock.")
            cls._instances["spacy"] = None
            return None

    @classmethod
    def load_fasttext(cls, model_path: str):
        """
        Loads the compressed fastText language detector.
        """
        if "fasttext" in cls._instances:
            return cls._instances["fasttext"]
            
        logger.info(f"Loading fastText from {model_path}...")
        try:
            model = fasttext.load_model(model_path)
            cls._instances["fasttext"] = model
            return model
        except Exception as e:
            logger.error(f"❌ Failed to load fastText: {e}")
            # Non-critical? Maybe return None or raise. 
            # For this architecture, let's treat it as critical.
            raise e
