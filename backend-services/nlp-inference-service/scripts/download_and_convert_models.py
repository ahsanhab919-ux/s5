
import os
import logging
import ctranslate2
import transformers
import stanza
import gensim.downloader as api
import fasttext.util

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("model_builder")

def convert_t5_paraphrase():
    """
    Downloads the paraphrase T5-Base model and converts it to CTranslate2 INT8 format.
    Uses humarin/chatgpt_paraphraser_on_T5_base: same T5-base architecture (250M) and
    tokenizer as flan-t5-base, but fine-tuned on ~420K ChatGPT paraphrase pairs for
    measurably better paraphrase quality. Drop-in on the existing CTranslate2 INT8 path.
    License: OpenRAIL (commercial use permitted with attribution).
    """
    model_name = "humarin/chatgpt_paraphraser_on_T5_base"  # Purpose-built paraphraser
    output_dir = "/models/paraphrase"
    
    logger.info(f"Downloading and converting {model_name} to CTranslate2 INT8...")
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            converter = ctranslate2.converters.TransformersConverter(
                model_name,
                load_as_float16=False # We are on CPU build
            )
            
            converter.convert(
                output_dir=output_dir,
                quantization="int8", # CRITICAL for 2GB RAM
                force=True
            )
            
            # Also save the tokenizer
            tokenizer = transformers.AutoTokenizer.from_pretrained(model_name)
            tokenizer.save_pretrained(output_dir)
            logger.info("✅ T5 Conversion Complete.")
            break # Success
        except Exception as e:
            logger.warning(f"⚠️ Attempt {attempt+1}/{max_retries} failed: {e}")
            if attempt == max_retries - 1:
                logger.error(f"❌ T5 Conversion Failed after {max_retries} attempts.")
                raise e
            import time
            time.sleep(5) # Wait before retry

def download_nllb_optimized():
    """
    Downloads NLLB-200 Distilled (600M) and converts to CTranslate2 INT8.
    This enables the "Pivot Strategy" for 200+ languages.
    """
    model_name = "facebook/nllb-200-distilled-600M"
    output_dir = "/models/translation" # Shared for pivot in/out
    
    if os.path.exists(output_dir) and os.path.exists(os.path.join(output_dir, "model.bin")):
        logger.info(f"✅ NLLB model already exists at {output_dir}")
        return

    logger.info(f"Downloading and converting {model_name} for Multilingual Support...")
    
    # Needs sentencepiece
    try:
        converter = ctranslate2.converters.TransformersConverter(
            model_name,
            load_as_float16=False
        )
        converter.convert(
            output_dir=output_dir,
            quantization="int8",
            force=True
        )
        
        tokenizer = transformers.AutoTokenizer.from_pretrained(model_name)
        tokenizer.save_pretrained(output_dir)
        logger.info("✅ NLLB Conversion Complete.")
    except Exception as e:
        logger.error(f"❌ NLLB Conversion Failed: {e}")
        # Non-critical for English-only MVP, but critical for "QuillBot Killer"
        raise e

def download_stanza_optimized():
    """
    Downloads only the Tokenize and NER processors for Stanza.
    """
    output_dir = "/models/stanza_resources"
    logger.info("Downloading Optimized Stanza Models (Mimic/i2b2)...")
    
    # We use the 'mimic' package which is trained on clinical notes
    # Valid processors: tokenize, ner
    stanza.download(
        lang='en',
        package='mimic',
        processors='tokenize,ner',
        model_dir=output_dir,
        verbose=True
    )
    logger.info("✅ Stanza Download Complete.")

def download_gensim_vectors():
    """
    Downloads GloVe vectors.
    """
    logger.info("Downloading GloVe-100d vectors...")
    # api.load() downloads to ~/gensim-data by default. 
    # We need to move it or load it and save it to our target dir.
    # Note: gensim-data download is large. For production build, 
    # it's often safer to curl the specific file if known.
    
    # Ideally, we mock this for the script if network is restricted,
    # or ensure we have network access in build stage.
    try:
        model = api.load("glove-wiki-gigaword-100")
        output_path = "/models/vectors/glove.100d.kv"
        model.save(output_path)
        logger.info("✅ Gensim Vectors Saved.")
    except Exception as e:
        logger.warning(f"⚠️ Could not download Gensim vectors via API: {e}")

def download_fasttext():
    """
    Downloads the compressed fastText language ID model.
    """
    logger.info("Downloading fastText language detector...")
    # We use the compressed version : lid.176.ftz
    url = "https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.ftz"
    output_path = "/models/fasttext/lid.176.ftz"
    
    # Use curl via os.system or requests
    os.system(f"curl -L {url} -o {output_path}")
    logger.info("✅ fastText Downloaded.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--step", type=str, required=True, help="t5, nllb, stanza, fasttext, or all")
    args = parser.parse_args()

    logger.info(f"---- Starting Build Step: {args.step} ----")
    
    try:
        if args.step in ["t5", "all"]:
            convert_t5_paraphrase()
        if args.step in ["nllb", "all"]:
            download_nllb_optimized()
        if args.step in ["stanza", "all"]:
            download_stanza_optimized()
        if args.step in ["fasttext", "all"]:
            download_fasttext()
            
        logger.info(f"✅ Step {args.step} Complete.")
    except Exception as e:
        logger.error(f"❌ Step {args.step} Failed: {e}")
        exit(1)
