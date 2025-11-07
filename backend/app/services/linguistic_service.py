import time
import logging
import os
import json
from pathlib import Path
from functools import lru_cache
from typing import List, Dict, Any, Optional, Tuple

from app.models.linguistic import LinguisticResponse, ManipulationSignal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
CACHE_DIR = str(Path("~/.cache/verifyx/linguistic").expanduser())
MODEL_NAMES = {
    'zero_shot': "facebook/bart-large-mnli",
    'sentiment': "distilbert-base-uncased-finetuned-sst-2-english"
}
MAX_TEXT_LENGTH = 1000  # Characters
CACHE_SIZE = 1000  # Number of items to cache

# Ensure cache directory exists
os.makedirs(CACHE_DIR, exist_ok=True)

# Initialize models with type hints
_zero_shot = None
_sentiment = None
_model_loaded = False
_TRANSFORMERS = False
pipeline = None

# Check for dependencies
try:
    from transformers import pipeline  # type: ignore
    import torch  # type: ignore
    from torch import device as torch_device  # type: ignore
    _TRANSFORMERS = True
except ImportError as e:
    logger.warning(f"Transformers not available: {e}")
    _TRANSFORMERS = False
    pipeline = None
    torch_device = None

# Predefined patterns and keywords
MANIPULATION_KEYWORDS = {
    'manipulative': [
        'hoax', 'conspiracy', 'secret', 'they don\'t want you to know',
        'wake up', 'open your eyes', 'mainstream media', 'fake news'
    ],
    'sensational': [
        'shocking', 'mind-blowing', 'unbelievable', 'you won\'t believe',
        'amazing', 'incredible', 'jaw-dropping', 'heart-stopping'
    ],
    'neutral': [
        'according to', 'research shows', 'studies indicate', 'reportedly',
        'sources say', 'official statement', 'press release'
    ]
}

SENTIMENT_LABELS = ["negative", "neutral", "positive"]

def _load_models(device: Optional[str] = None) -> Tuple[bool, str]:
    """
    Load NLP models for text analysis.
    
    Args:
        device: Optional device to load models on ('cuda' or 'cpu'). If None, auto-detects.
        
    Returns:
        Tuple of (success: bool, message: str)
    """
    global _zero_shot, _sentiment, _model_loaded, _TRANSFORMERS, pipeline
    
    # Re-check transformers availability
    if not _TRANSFORMERS:
        try:
            from transformers import pipeline as transformers_pipeline  # type: ignore
            import torch  # type: ignore
            from torch import device as torch_device  # type: ignore
            pipeline = transformers_pipeline
            _TRANSFORMERS = True
        except ImportError as e:
            logger.error(f"Failed to import transformers: {e}")
            return False, "Transformers library not available"
    
    if not pipeline:
        return False, "Failed to initialize pipeline"
        
    if _model_loaded:
        return True, "Models already loaded"
    
    try:
        # Determine device
        if device is None:
            try:
                import torch  # type: ignore
                device = "cuda" if torch.cuda.is_available() else "cpu"
                logger.info(f"Auto-detected device: {device}")
            except Exception as e:
                logger.warning(f"Failed to detect device, defaulting to CPU: {e}")
                device = "cpu"
        else:
            if device not in ["cuda", "cpu"]:
                logger.warning(f"Invalid device '{device}', defaulting to CPU")
                device = "cpu"
    
        logger.info(f"Loading NLP models on {device}...")
        
        # Initialize device mapping
        device_id = 0 if device == "cuda" and torch.cuda.is_available() else -1
        
        # Load zero-shot classification model
        _zero_shot = pipeline(
            task="zero-shot-classification",
            model=MODEL_NAMES['zero_shot'],
            device=device_id,
            cache_dir=CACHE_DIR,
            use_fast=True,
            framework="pt"  # Explicitly use PyTorch
        )
        
        # Load sentiment analysis model
        _sentiment = pipeline(
            task="text-classification",  # Changed from "sentiment-analysis" to "text-classification"
            model=MODEL_NAMES['sentiment'],
            device=device_id,
            cache_dir=CACHE_DIR,
            use_fast=True,
            framework="pt"  # Explicitly use PyTorch
        )
        
        _model_loaded = True
        logger.info("Successfully loaded NLP models")
        return True, f"Models loaded on {device}"
        
    except Exception as e:
        error_msg = f"Failed to load NLP models: {str(e)}"
        logger.error(error_msg, exc_info=True)
        _zero_shot = _sentiment = None
        _model_loaded = False
        return False, error_msg

@lru_cache(maxsize=CACHE_SIZE)
def _cached_analyze(text: str) -> Dict[str, Any]:
    """
    Cached analysis of text to avoid redundant processing.
    
    Args:
        text: Text to analyze
        
    Returns:
        Dictionary with analysis results
    """
    if not text or not isinstance(text, str):
        return {"error": "Invalid input text"}
        
    # Truncate very long texts to prevent excessive processing
    if len(text) > MAX_TEXT_LENGTH:
        text = text[:MAX_TEXT_LENGTH]
        logger.warning(f"Text truncated to {MAX_TEXT_LENGTH} characters")
    
    result = {
        "dominant_tone": "neutral",
        "sentiment": "neutral",
        "manipulation_score": 0.0,
        "raw_probs": {},
        "signals": [],
        "error": None
    }
    
    # Use ML models if available
    if _zero_shot is not None and text.strip():
        try:
            # Get classification with confidence scores
            classification = _zero_shot(
                text,
                candidate_labels=list(MANIPULATION_KEYWORDS.keys()),
                multi_label=True
            )
            
            if not isinstance(classification, dict) or 'labels' not in classification or 'scores' not in classification:
                raise ValueError("Invalid classification result format")
            
            # Process results
            labels = classification.get("labels", [])
            scores = classification.get("scores", [])
            
            if not labels or not scores:
                raise ValueError("Empty classification results")
            
            # Update results with model predictions
            result["raw_probs"] = dict(zip(labels, scores))
            result["dominant_tone"] = labels[0] if labels else "neutral"
            
            # Calculate manipulation score (sum of manipulative and sensational scores)
            manip_score = sum(
                score for label, score in zip(labels, scores)
                if isinstance(score, (int, float)) and label in ["manipulative", "sensational"]
            )
            result["manipulation_score"] = float(min(1.0, max(0.0, manip_score)))
            
            # Add signals for each detected category
            result["signals"] = [
                {"label": label, "confidence": float(score)}
                for label, score in zip(labels, scores)
                if isinstance(score, (int, float))
            ]
            
        except Exception as e:
            error_msg = f"Error in zero-shot classification: {str(e)}"
            logger.error(error_msg, exc_info=True)
            result["error"] = error_msg
            
    # Fallback to keyword matching if ML models fail or aren't available
    if not result["raw_probs"]:
        logger.warning("Using keyword-based fallback analysis")
        
        # Count keyword matches
        lower_text = text.lower()
        keyword_counts = {}
        
        for category, keywords in MANIPULATION_KEYWORDS.items():
            count = sum(1 for kw in keywords if kw in lower_text)
            if count > 0:
                keyword_counts[category] = count
        
        # Calculate scores based on keyword matches
        if keyword_counts:
            total_matches = sum(keyword_counts.values())
            result["raw_probs"] = {
                cat: min(0.9, (count / total_matches) * 2)  # Cap at 0.9 to indicate fallback
                for cat, count in keyword_counts.items()
            }
            result["dominant_tone"] = max(
                keyword_counts.items(), 
                key=lambda x: x[1]
            )[0]
            
            # Calculate manipulation score
            manip_score = sum(
                score for cat, score in result["raw_probs"].items()
                if cat in ["manipulative", "sensational"]
            )
            result["manipulation_score"] = min(1.0, manip_score)
            
            # Add signals
            result["signals"] = [
                {"label": cat, "confidence": float(score)}
                for cat, score in result["raw_probs"].items()
            ]
    
    # Analyze sentiment if model is available
    if _sentiment is not None and text.strip():
        try:
            sentiment_result = _sentiment(text)[0]
            # Map the output to our expected format
            sentiment_label = sentiment_result["label"].lower()
            if "positive" in sentiment_label:
                result["sentiment"] = "positive"
            elif "negative" in sentiment_label:
                result["sentiment"] = "negative"
            else:
                result["sentiment"] = "neutral"
            
            # Add sentiment to signals if not already present
            if not any(s.get("label") == "sentiment" for s in result["signals"]):
                result["signals"].append({
                    "label": "sentiment",
                    "value": result["sentiment"],
                    "confidence": float(sentiment_result.get("score", 0.0))
                })
                
        except Exception as e:
            logger.warning(f"Sentiment analysis failed: {str(e)}")
            logger.debug(f"Failed text: {text[:100]}...")  # Log first 100 chars for debugging
    
    return result

def analyze_text(text: str) -> LinguisticResponse:
    """
    Analyze text for manipulation, sentiment, and other linguistic features.
    
    Args:
        text: Input text to analyze
        
    Returns:
        LinguisticResponse with analysis results
    """
    start_time = time.time()
    
    # Initialize models if needed
    if _TRANSFORMERS and (_zero_shot is None or _sentiment is None):
        success, msg = _load_models()
        if not success:
            logger.warning(f"Using fallback analysis: {msg}")
    
    # Ensure text is a non-empty string
    if not text or not isinstance(text, str):
        text = ""
    
    # Get cached or fresh analysis
    analysis = _cached_analyze(text)
    
    # Convert signals to ManipulationSignal objects
    signals = []
    for s in analysis.get("signals", []):
        if not isinstance(s, dict):
            continue
            
        signal = {}
        if "label" in s and isinstance(s["label"], str):
            signal["label"] = s["label"]
        
        if "confidence" in s and isinstance(s["confidence"], (int, float)):
            signal["confidence"] = float(s["confidence"])
        else:
            signal["confidence"] = 0.0
            
        if "value" in s:
            signal["value"] = s["value"]
            
        if signal:
            signals.append(ManipulationSignal(**signal))
    
    # Get dominant tone with fallback
    dominant_tone = "neutral"
    if "dominant_tone" in analysis and isinstance(analysis["dominant_tone"], str):
        dominant_tone = analysis["dominant_tone"]
    
    # Get sentiment with fallback
    sentiment = "neutral"
    if "sentiment" in analysis and isinstance(analysis["sentiment"], str):
        sentiment = analysis["sentiment"]
    
    # Get manipulation score with fallback
    manipulation_score = 0.0
    if "manipulation_score" in analysis and isinstance(analysis["manipulation_score"], (int, float)):
        manipulation_score = float(analysis["manipulation_score"])
    
    # Get raw_probs with fallback
    raw_probs = {}
    if "raw_probs" in analysis and isinstance(analysis["raw_probs"], dict):
        raw_probs = {
            str(k): float(v) 
            for k, v in analysis["raw_probs"].items() 
            if isinstance(v, (int, float))
        }
    
    # Calculate processing time
    latency_ms = int((time.time() - start_time) * 1000)
    
    # If there was an error in analysis, log it but still return a valid response
    if "error" in analysis and analysis["error"]:
        logger.error(f"Analysis completed with errors: {analysis['error']}")
    
    # Create and return response
    return LinguisticResponse(
        dominant_tone=dominant_tone,
        sentiment=sentiment,
        manipulation_score=manipulation_score,
        signals=signals,
        raw_probs=raw_probs,
        latency_ms=latency_ms
    )