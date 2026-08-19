"""
Confidence scoring utilities.

These functions centralise the logic for deciding whether a transcription
segment or summary item should be flagged — keeping the threshold values in
one place and making them easy to test in isolation.
"""

from __future__ import annotations

from app.config import settings


def is_low_confidence_segment(confidence: float | None) -> bool:
    """
    Return True if a transcription segment should be visually flagged.

    We use None-safety here: if the ASR provider did not return a confidence
    value (e.g., some cloud APIs), we treat it as unknown (not low) to avoid
    false positives — the user can't act on a flag they can't verify.
    """
    if confidence is None:
        return False
    return confidence < settings.low_confidence_threshold


def is_uncertain_speaker(speaker_confidence: float | None) -> bool:
    """
    Return True if a speaker label should be shown as 'uncertain speaker'.

    The threshold is lower than transcription confidence because diarization
    errors (wrong speaker identity) are often more harmful in meeting notes
    than a slightly garbled transcription.
    """
    if speaker_confidence is None:
        return False
    return speaker_confidence < settings.diarization_confidence_threshold


def compute_segment_confidence(word_probabilities: list[float]) -> float | None:
    """
    Compute segment confidence as the mean of word-level probabilities.

    Returns None for empty lists (no words — happens in silence segments).
    Using mean rather than min avoids over-penalising segments where one
    uncommon word is misheard but the rest is clear.
    """
    if not word_probabilities:
        return None
    return sum(word_probabilities) / len(word_probabilities)


def confidence_label(confidence: float | None) -> str:
    """
    Convert a float confidence score to a human-readable label.

    Used in API responses and log messages.
    """
    if confidence is None:
        return "unknown"
    if confidence >= 0.85:
        return "high"
    if confidence >= settings.low_confidence_threshold:
        return "medium"
    return "low"
