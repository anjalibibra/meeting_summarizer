"""
OpenAI Whisper ASR provider (local inference).

We chose local Whisper over a paid ASR API for two reasons:
  1. Cost — no per-minute billing; processing is free after one-time setup.
  2. Privacy — audio never leaves the machine (important for confidential meetings).

Trade-off: local inference is slower than cloud APIs and requires a capable
machine (a GPU helps significantly for medium/large models).

Both the original `openai-whisper` package and the `faster-whisper` library
(CTranslate2 backend, ~4× faster on CPU) are supported.  The provider is
selected via the ASR_PROVIDER env var.

Word-level timestamps are enabled so we can compute per-segment confidence
as the mean word probability — a more reliable signal than the segment-level
logprob Whisper also exposes.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING

from app.config import settings
from app.services.asr.base import ASRError, ASRResult, ASRSegment, BaseASRProvider

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    pass


class WhisperProvider(BaseASRProvider):
    """
    ASR provider using the original openai-whisper library.

    Model is loaded once at construction time and held in memory.
    For production, consider lazy loading with a lock to avoid loading
    the model during the health-check request.
    """

    def __init__(self) -> None:
        try:
            import whisper
        except ImportError as e:
            raise ImportError(
                "openai-whisper is not installed. Run: pip install openai-whisper"
            ) from e

        model_size = settings.whisper_model_size
        logger.info("Loading Whisper model '%s'…", model_size)
        self._model = whisper.load_model(model_size)
        logger.info("Whisper model '%s' loaded.", model_size)

    @property
    def provider_name(self) -> str:
        return f"whisper-{settings.whisper_model_size}"

    def transcribe(self, audio_path: Path) -> ASRResult:
        """
        Run Whisper inference with word-level timestamps.

        word_timestamps=True is critical: it gives us per-word probability
        values that we use to flag low-confidence segments rather than
        silently accepting uncertain output.
        """
        if not audio_path.exists():
            raise ASRError(f"Audio file not found: {audio_path}")

        logger.info("Transcribing %s with Whisper…", audio_path.name)

        try:
            result = self._model.transcribe(
                str(audio_path),
                word_timestamps=True,
                verbose=False,
            )
        except Exception as e:
            raise ASRError(f"Whisper transcription failed: {e}") from e

        segments: list[ASRSegment] = []
        has_speech = False

        for seg in result.get("segments", []):
            words = seg.get("words", [])

            # Calculate segment confidence as mean of word probabilities.
            # Whisper exposes 'probability' on each word object when
            # word_timestamps=True.  Fall back to None if unavailable.
            if words:
                confidences = [w.get("probability", 0.0) for w in words]
                segment_confidence = sum(confidences) / len(confidences)
            else:
                # No word data — use segment-level avg_logprob heuristically
                avg_logprob = seg.get("avg_logprob", -1.0)
                # logprob is in (-∞, 0]; map to (0, 1] with a sigmoid-like scale
                import math
                segment_confidence = max(0.0, min(1.0, math.exp(avg_logprob)))

            text = seg.get("text", "").strip()
            if text:
                has_speech = True

            segments.append(
                ASRSegment(
                    start_time=seg.get("start", 0.0),
                    end_time=seg.get("end", 0.0),
                    text=text,
                    confidence=segment_confidence,
                    words=[
                        {
                            "word": w.get("word", ""),
                            "start": w.get("start", 0.0),
                            "end": w.get("end", 0.0),
                            "probability": w.get("probability", 0.0),
                        }
                        for w in words
                    ],
                )
            )

        # Handle silence / no speech edge case
        if not segments or not has_speech:
            logger.warning("No speech detected in %s", audio_path.name)

        return ASRResult(
            segments=segments,
            detected_language=result.get("language"),
            has_speech=has_speech,
        )


class FasterWhisperProvider(BaseASRProvider):
    """
    ASR provider using the faster-whisper library (CTranslate2 backend).

    faster-whisper is ~2-4× faster than openai-whisper on CPU and uses
    significantly less memory, making it preferable for production deployments
    that don't have a GPU.
    """

    def __init__(self) -> None:
        try:
            from faster_whisper import WhisperModel
        except ImportError as e:
            raise ImportError(
                "faster-whisper is not installed. Run: pip install faster-whisper"
            ) from e

        model_size = settings.whisper_model_size
        logger.info("Loading faster-whisper model '%s'…", model_size)
        # device="auto" selects GPU if available, falls back to CPU
        self._model = WhisperModel(model_size, device="auto", compute_type="int8")
        logger.info("faster-whisper model '%s' loaded.", model_size)

    @property
    def provider_name(self) -> str:
        return f"faster-whisper-{settings.whisper_model_size}"

    def transcribe(self, audio_path: Path) -> ASRResult:
        if not audio_path.exists():
            raise ASRError(f"Audio file not found: {audio_path}")

        logger.info("Transcribing %s with faster-whisper…", audio_path.name)

        try:
            segments_iter, info = self._model.transcribe(
                str(audio_path),
                word_timestamps=True,
                vad_filter=True,  # Skip silence — reduces hallucinations
            )
        except Exception as e:
            raise ASRError(f"faster-whisper transcription failed: {e}") from e

        segments: list[ASRSegment] = []
        has_speech = False

        for seg in segments_iter:
            words = list(seg.words or [])

            if words:
                # faster-whisper word objects have a .probability attribute
                confidences = [w.probability for w in words]
                confidence = sum(confidences) / len(confidences)
                word_dicts = [
                    {"word": w.word, "start": w.start, "end": w.end, "probability": w.probability}
                    for w in words
                ]
            else:
                confidence = None
                word_dicts = []

            text = seg.text.strip()
            if text:
                has_speech = True

            segments.append(
                ASRSegment(
                    start_time=seg.start,
                    end_time=seg.end,
                    text=text,
                    confidence=confidence,
                    words=word_dicts,
                )
            )

        if not segments or not has_speech:
            logger.warning("No speech detected in %s", audio_path.name)

        return ASRResult(
            segments=segments,
            detected_language=info.language if info else None,
            has_speech=has_speech,
        )


class StubASRProvider(BaseASRProvider):
    """
    Deterministic stub for unit tests.

    Returns a fixed transcript so tests don't require a GPU or model download.
    """

    @property
    def provider_name(self) -> str:
        return "stub-asr"

    def transcribe(self, audio_path: Path) -> ASRResult:
        return ASRResult(
            segments=[
                ASRSegment(
                    start_time=0.0,
                    end_time=5.0,
                    text="Let's finalize the product roadmap and release schedule for Q3.",
                    confidence=0.95,
                ),
                ASRSegment(
                    start_time=5.0,
                    end_time=10.0,
                    text="I will handle the backend API deployment and database connection pooling.",
                    confidence=0.92,
                ),
                ASRSegment(
                    start_time=10.0,
                    end_time=15.0,
                    text="I'll complete the integration test suite and design review before Wednesday.",
                    confidence=0.89,
                ),
            ],
            detected_language="en",
            has_speech=True,
        )


def get_asr_provider() -> BaseASRProvider:
    """
    Factory function that returns the configured ASR provider.

    Called once at startup and the result is cached so the model
    is only loaded into memory once.
    """
    provider = settings.asr_provider
    if provider == "whisper":
        return WhisperProvider()
    elif provider == "faster_whisper":
        return FasterWhisperProvider()
    elif provider == "stub":
        return StubASRProvider()
    else:
        raise ValueError(f"Unknown ASR provider: {provider!r}")
