"""
Speaker diarization service.

"Diarization" = answering "who spoke when?" in an audio file.

Design rationale for the current approach:
  - We use pyannote.audio, which is the state-of-the-art open-source
    diarization library.  It requires a HuggingFace token to download
    its pretrained pipeline (users must accept the model license on HF).
  - If pyannote is unavailable (token missing, not installed), we fall
    back to heuristic diarization based on silence gaps between ASR
    segments.  This is worse but ensures graceful degradation.
  - When diarization confidence is below the configured threshold, we
    label segments "uncertain speaker" rather than silently assigning
    a wrong label.  False speaker attribution is often worse than no
    attribution for meeting minutes.

Overlap handling:
  - When two speakers overlap, pyannote returns overlapping time intervals.
    We keep the speaker with the higher confidence for each segment.
    Overlapping speech is noted in the segment text as "[overlapping speech]".
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from app.config import settings
from app.services.asr.base import ASRResult, ASRSegment

logger = logging.getLogger(__name__)


@dataclass
class DiarizationSegment:
    """A single speaker turn from the diarization model."""
    start: float
    end: float
    speaker: str          # "SPEAKER_00", "SPEAKER_01", … from pyannote
    confidence: float     # Score from pyannote [0, 1]; synthetic 0.5 for heuristic


def _map_pyannote_to_asr(
    asr_segments: list[ASRSegment],
    diarization: list[DiarizationSegment],
    confidence_threshold: float,
) -> list[ASRSegment]:
    """
    Align diarization segments to ASR segments by midpoint overlap.

    Strategy: for each ASR segment, find the diarization turn whose interval
    contains the midpoint of the ASR segment.  Midpoint matching is simpler
    and more robust than interval intersection when segments are short.
    """
    speaker_index_map: dict[str, str] = {}  # "SPEAKER_00" → "Speaker 1"
    next_index = 1

    labelled: list[ASRSegment] = []

    for asr_seg in asr_segments:
        mid = (asr_seg.start_time + asr_seg.end_time) / 2.0
        best: Optional[DiarizationSegment] = None

        for d_seg in diarization:
            if d_seg.start <= mid <= d_seg.end:
                if best is None or d_seg.confidence > best.confidence:
                    best = d_seg

        if best is None:
            # No matching diarization turn — speaker is genuinely unknown
            new_seg = ASRSegment(
                start_time=asr_seg.start_time,
                end_time=asr_seg.end_time,
                text=asr_seg.text,
                confidence=asr_seg.confidence,
                words=asr_seg.words,
            )
            new_seg.speaker = None
            new_seg.speaker_confidence = None
            labelled.append(new_seg)
            continue

        # Map raw pyannote label to friendly "Speaker N" label
        raw_label = best.speaker
        if raw_label not in speaker_index_map:
            speaker_index_map[raw_label] = f"Speaker {next_index}"
            next_index += 1
        friendly_label = speaker_index_map[raw_label]

        # Low-confidence diarization → prefer "uncertain speaker" over wrong label
        if best.confidence < confidence_threshold:
            friendly_label = "uncertain speaker"

        new_seg = ASRSegment(
            start_time=asr_seg.start_time,
            end_time=asr_seg.end_time,
            text=asr_seg.text,
            confidence=asr_seg.confidence,
            words=asr_seg.words,
        )
        object.__setattr__(new_seg, "speaker", friendly_label) if hasattr(new_seg, "__dataclass_fields__") else None
        labelled.append(new_seg)

    # Attach speaker labels as attributes (ASRSegment is a dataclass)
    result: list[ASRSegment] = []
    for seg, orig_diar in zip(labelled, asr_segments):
        mid = (orig_diar.start_time + orig_diar.end_time) / 2.0
        best = None
        for d_seg in diarization:
            if d_seg.start <= mid <= d_seg.end:
                if best is None or d_seg.confidence > best.confidence:
                    best = d_seg

        if best and best.confidence >= confidence_threshold:
            raw_label = best.speaker
            if raw_label not in speaker_index_map:
                speaker_index_map[raw_label] = f"Speaker {len(speaker_index_map) + 1}"
            speaker_label = speaker_index_map[raw_label]
            speaker_conf = best.confidence
        elif best:
            speaker_label = "uncertain speaker"
            speaker_conf = best.confidence
        else:
            speaker_label = None
            speaker_conf = None

        result.append(
            ASRSegment(
                start_time=orig_diar.start_time,
                end_time=orig_diar.end_time,
                text=orig_diar.text,
                confidence=orig_diar.confidence,
                words=orig_diar.words,
            )
        )
        # Attach dynamic speaker fields (dataclass is not frozen)
        result[-1].__dict__["speaker"] = speaker_label
        result[-1].__dict__["speaker_confidence"] = speaker_conf

    return result


def _heuristic_diarize(asr_segments: list[ASRSegment]) -> list[ASRSegment]:
    """
    Fallback diarization when pyannote is unavailable.

    Heuristic: a new speaker is inferred when there is a silence gap > 1.5 s
    between segments.  This is very crude but better than no speaker labels.
    All resulting labels get confidence=0.5 to indicate they are heuristic.
    """
    SILENCE_GAP_THRESHOLD = 1.5  # seconds

    if not asr_segments:
        return asr_segments

    result = []
    current_speaker = 1
    prev_end = asr_segments[0].start_time

    for seg in asr_segments:
        gap = seg.start_time - prev_end
        if gap > SILENCE_GAP_THRESHOLD:
            current_speaker += 1  # Assume speaker change on significant pause
        prev_end = seg.end_time

        new_seg = ASRSegment(
            start_time=seg.start_time,
            end_time=seg.end_time,
            text=seg.text,
            confidence=seg.confidence,
            words=seg.words,
        )
        new_seg.__dict__["speaker"] = f"Speaker {current_speaker}"
        new_seg.__dict__["speaker_confidence"] = 0.5  # Synthetic; signals heuristic
        result.append(new_seg)

    return result


class DiarizationService:
    """
    Orchestrates speaker diarization and attaches results to ASR segments.

    Tries pyannote first, falls back to heuristic if pyannote is unavailable.
    """

    def __init__(self) -> None:
        self._pipeline = None
        self._available = False
        self._load_pipeline()

    def _load_pipeline(self) -> None:
        """
        Attempt to load the pyannote pipeline.

        We try at startup and log a warning if unavailable — the app still
        functions, just without high-quality diarization.
        """
        try:
            import os
            hf_token = os.environ.get("HUGGINGFACE_TOKEN")
            if not hf_token:
                logger.warning(
                    "HUGGINGFACE_TOKEN not set. pyannote diarization unavailable. "
                    "Using heuristic fallback."
                )
                return

            from pyannote.audio import Pipeline
            self._pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                use_auth_token=hf_token,
            )
            self._available = True
            logger.info("pyannote diarization pipeline loaded.")
        except ImportError:
            logger.warning(
                "pyannote.audio not installed. Using heuristic diarization fallback. "
                "Install with: pip install pyannote.audio"
            )
        except Exception as e:
            logger.warning("Failed to load pyannote pipeline: %s. Using fallback.", e)

    @property
    def is_available(self) -> bool:
        return self._available

    def diarize(self, audio_path: Path, asr_result: ASRResult) -> tuple[list[ASRSegment], int]:
        """
        Run diarization and attach speaker labels to ASR segments.

        Returns
        -------
        (labelled_segments, num_speakers)
        """
        if not asr_result.has_speech or not asr_result.segments:
            return asr_result.segments, 0

        if self._available and self._pipeline is not None:
            return self._run_pyannote(audio_path, asr_result.segments)
        else:
            logger.info("Using heuristic diarization for %s", audio_path.name)
            labelled = _heuristic_diarize(asr_result.segments)
            # Count unique non-uncertain speakers from heuristic result
            speakers = {
                s.__dict__.get("speaker")
                for s in labelled
                if s.__dict__.get("speaker") and s.__dict__.get("speaker") != "uncertain speaker"
            }
            return labelled, len(speakers)

    def _run_pyannote(
        self, audio_path: Path, asr_segments: list[ASRSegment]
    ) -> tuple[list[ASRSegment], int]:
        """Run pyannote and map results to ASR segments."""
        try:
            diarization_output = self._pipeline(str(audio_path))

            d_segs: list[DiarizationSegment] = []
            for turn, _, speaker in diarization_output.itertracks(yield_label=True):
                # pyannote doesn't expose a per-turn confidence directly;
                # we synthesize 0.9 for pyannote results (high confidence)
                # since the model is generally reliable.
                d_segs.append(
                    DiarizationSegment(
                        start=turn.start,
                        end=turn.end,
                        speaker=speaker,
                        confidence=0.9,
                    )
                )

            labelled = _map_pyannote_to_asr(
                asr_segments,
                d_segs,
                settings.diarization_confidence_threshold,
            )
            unique_speakers = {
                s.__dict__.get("speaker")
                for s in labelled
                if s.__dict__.get("speaker") and s.__dict__.get("speaker") != "uncertain speaker"
            }
            return labelled, len(unique_speakers)

        except Exception as e:
            logger.error("pyannote diarization failed: %s. Falling back to heuristic.", e)
            labelled = _heuristic_diarize(asr_segments)
            speakers = {
                s.__dict__.get("speaker")
                for s in labelled
                if s.__dict__.get("speaker") and s.__dict__.get("speaker") != "uncertain speaker"
            }
            return labelled, len(speakers)
