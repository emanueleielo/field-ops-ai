"""Language detection utilities for SMS messages."""

import logging
import re
from typing import Literal

logger = logging.getLogger(__name__)

# Supported languages
SupportedLanguage = Literal["en", "de", "fr", "it", "es"]

# Default language when detection fails
DEFAULT_LANGUAGE: SupportedLanguage = "en"

# Common words/patterns for language detection
# These are high-frequency words that are distinctive to each language
LANGUAGE_MARKERS: dict[str, list[str]] = {
    "en": [
        r"\b(the|and|is|are|was|were|have|has|do|does|will|would|can|could)\b",
        r"\b(what|how|where|when|why|which|who)\b",
        r"\b(please|thank|thanks|yes|no|ok|okay)\b",
        r"\b(error|problem|issue|help|need|want)\b",
    ],
    "de": [
        r"\b(der|die|das|und|ist|sind|war|waren|haben|hat)\b",
        r"\b(was|wie|wo|wann|warum|welche|wer)\b",
        r"\b(bitte|danke|ja|nein|nicht|auch|oder)\b",
        r"\b(fehler|problem|hilfe|brauche|muss)\b",
        r"\b(ich|du|er|sie|es|wir|ihr|sie)\b",
    ],
    "fr": [
        r"\b(le|la|les|et|est|sont|etait|ont|avons|avez)\b",
        r"\b(que|quoi|comment|ou|quand|pourquoi)\b",
        r"\b(s'il vous plait|merci|oui|non|peut)\b",
        r"\b(erreur|probleme|aide|besoin|faut)\b",
        r"\b(je|tu|il|elle|nous|vous|ils|elles)\b",
    ],
    "it": [
        r"\b(il|lo|la|i|gli|le|e|ed|sono|era|hanno|ha)\b",
        r"\b(che|cosa|come|dove|quando|perche|quale)\b",
        r"\b(per favore|grazie|si|no|puo)\b",
        r"\b(errore|problema|aiuto|bisogno|devo)\b",
        r"\b(io|tu|lui|lei|noi|voi|loro)\b",
    ],
    "es": [
        r"\b(el|la|los|las|y|es|son|era|tienen|tiene)\b",
        r"\b(que|como|donde|cuando|por que|cual)\b",
        r"\b(por favor|gracias|si|no|puede)\b",
        r"\b(error|problema|ayuda|necesito|debo)\b",
        r"\b(yo|tu|el|ella|nosotros|vosotros|ellos)\b",
    ],
}

# Compile patterns for efficiency
COMPILED_PATTERNS: dict[str, list[re.Pattern[str]]] = {
    lang: [re.compile(pattern, re.IGNORECASE) for pattern in patterns]
    for lang, patterns in LANGUAGE_MARKERS.items()
}


def detect_language(text: str) -> SupportedLanguage:
    """Detect the language of a text message.

    Uses simple pattern matching with common words to detect language.
    This is a lightweight implementation suitable for short SMS messages.

    Args:
        text: The text to analyze.

    Returns:
        Detected language code ('en', 'de', 'fr', 'it', 'es').
        Defaults to 'en' if detection is uncertain.
    """
    if not text or not text.strip():
        return DEFAULT_LANGUAGE

    # Normalize text for matching
    normalized = text.lower().strip()

    # Count matches for each language
    scores: dict[str, int] = {}

    for lang, patterns in COMPILED_PATTERNS.items():
        score = 0
        for pattern in patterns:
            matches = pattern.findall(normalized)
            score += len(matches)
        scores[lang] = score

    # Find language with highest score
    if not any(scores.values()):
        # No matches found, default to English
        logger.debug("No language patterns matched, defaulting to 'en'")
        return DEFAULT_LANGUAGE

    best_lang = max(scores, key=lambda k: scores[k])
    best_score = scores[best_lang]

    # Require minimum score to make a decision
    # This helps avoid false positives on very short messages
    if best_score < 2:
        logger.debug(
            "Low confidence score (%d) for language '%s', defaulting to 'en'",
            best_score,
            best_lang,
        )
        return DEFAULT_LANGUAGE

    logger.debug(
        "Detected language '%s' with score %d (scores: %s)",
        best_lang,
        best_score,
        scores,
    )

    return best_lang  # type: ignore[return-value]


def is_supported_language(lang: str) -> bool:
    """Check if a language code is supported.

    Args:
        lang: Language code to check.

    Returns:
        True if the language is supported, False otherwise.
    """
    return lang.lower()[:2] in ("en", "de", "fr", "it", "es")


def normalize_language_code(lang: str) -> SupportedLanguage:
    """Normalize a language code to a supported language.

    Args:
        lang: Language code to normalize (e.g., 'en-US', 'de-DE').

    Returns:
        Normalized language code or 'en' if not supported.
    """
    if not lang:
        return DEFAULT_LANGUAGE

    # Take first two characters and lowercase
    normalized = lang.lower()[:2]

    if normalized in ("en", "de", "fr", "it", "es"):
        return normalized  # type: ignore[return-value]

    return DEFAULT_LANGUAGE
