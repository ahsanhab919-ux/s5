
import logging
from typing import List, Dict, Any
import re

logger = logging.getLogger(__name__)

class TextProcessor:
    """
    Handles pre-processing:
    1. Regex Masking (Quotes, Citations)
    2. Entity Extraction (Stanza - STEAM terms)
    3. Input Cleaning
    """
    
    def __init__(self, spacy_pipeline=None):
        self.spacy_nlp = spacy_pipeline
        self.quote_pattern = re.compile(r'(".*?"|“.*?”|‘.*?’)')
        # Citations: [1], [12-14], (Author, 2020)
        self.citation_pattern = re.compile(r'(\[\d+(?:-\d+)?\]|\([A-Za-z\s]+, \d{4}\))')

    # ... (mask_immutable_content and restore_masks unchanged) ...

    def mask_immutable_content(self, text: str) -> Dict[str, Any]:
        """
        Replaces quotes and citations with tokens like __MASK_0__.
        Returns masked text and the mapping to restore it.
        """
        masks = {}
        mask_counter = 0
        
        def replace_match(match):
            nonlocal mask_counter
            token = f"__MASK_{mask_counter}__"
            masks[token] = match.group(0)
            mask_counter += 1
            return token

        # 1. Mask Quotes
        text = self.quote_pattern.sub(replace_match, text)
        
        # 2. Mask Citations
        text = self.citation_pattern.sub(replace_match, text)
        
        return {"masked_text": text, "mapping": masks}

    def restore_masks(self, text: str, mapping: Dict[str, str]) -> str:
        """
        Restores the original quotes/citations from tokens.
        """
        for token, original in mapping.items():
            text = text.replace(token, original)
        return text

    def extract_freeze_terms(self, text: str) -> List[str]:
        """
        Uses SpaCy to find entities (Organizations, Dates, Specialized Terms)
        that MUST NOT be paraphrased.
        """
        if not self.spacy_nlp:
            return []
            
        try:
            doc = self.spacy_nlp(text)
            freeze_list = []
            
            # SpaCy Standard Entities (Expand with SciSpacy later)
            # ORG: Organizations (Google, NASA)
            # DATE: Dates
            # GPE: Countries/Cities
            # PRODUCT: Products
            target_types = {"ORG", "DATE", "GPE", "PRODUCT", "WORK_OF_ART", "LAW"} 
            
            for ent in doc.ents:
                if ent.label_ in target_types:
                    freeze_list.append(ent.text)
            
            # De-duplicate
            return list(set(freeze_list))
        except Exception as e:
            logger.error(f"Error in entity extraction: {e}")
            return []
