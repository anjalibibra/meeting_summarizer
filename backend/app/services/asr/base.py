"""
Abstract base class for all ASR (Automatic Speech Recognition) providers.

Design rationale: we define an interface here rather than depending directly
on Whisper so that:
  1. Tests can inject a stub without loading a multi-GB model.
  2. Azure Cognitive Services, Google STT, or AWS Transcribe can be added
     by implementing this interface — the pipeline code never changes.
  3. It makes the contract explicit: every provider must return segments
     with confidence scores, even if they have to synthesize them.
"""

from __future__ import annotations

import abc
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class ASRSegment:
    """
    A single transcribed segment returned by an ASR provider.

    start_time / end_time are in seconds.
    confidence is the average word-level probability [0, 1].
    A confidence of None means the provider does not expose word probabilities
    (e.g., some cloud APIs); callers should treat it as unknown, not as 1.0.
    """
    start_time: float
    end_time: float
    text: str
    confidence: Optional[float] = None
    # Word-level detail for fine-grained confidence analysis
    words: list[dict] = field(default_factory=list)


@dataclass
class ASRResult:
    """
    Full output of a single transcription request.

    detected_language: ISO 639-1 code (e.g., "en"), or None if unknown.
    has_speech: False when the audio contains only silence or noise.
    """
    segments: list[ASRSegment]
    detected_language: Optional[str] = None
    has_speech: bool = True


class BaseASRProvider(abc.ABC):
    """
    Interface every ASR backend must implement.

    Implementations should be stateless after __init__ — a single instance
    is created at startup and reused across requests.
    """

    @abc.abstractmethod
    def transcribe(self, audio_path: Path) -> ASRResult:
        """
        Transcribe the audio file at *audio_path*.

        Parameters
        ----------
        audio_path:
            Path to a local audio file.  Providers are responsible for
            handling the conversion from the original format if needed.

        Returns
        -------
        ASRResult
            Structured transcription result with per-segment confidence.

        Raises
        ------
        ASRError
            On any unrecoverable transcription error.
        """
        ...

    @property
    @abc.abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider name for logging and status messages."""
        ...


class ASRError(Exception):
    """Raised when transcription fails in an unrecoverable way."""
    pass
