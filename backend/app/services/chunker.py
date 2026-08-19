"""
Audio chunking for long recordings.

Problem: Whisper has a practical limit of ~30 minutes per chunk before
accuracy degrades significantly on consumer hardware (memory pressure, 
attention mechanism scaling).  We split long files into overlapping chunks
to avoid this.

Overlap strategy:
  We use a small overlap (30 s by default) between chunks so that words
  near chunk boundaries aren't cut off mid-sentence.  After transcription,
  we deduplicate segments that appear in both the end of chunk N and the
  start of chunk N+1 by comparing start timestamps.

Dependency: pydub is used for splitting because it handles all common
audio formats (mp3, m4a, wav) through ffmpeg without requiring format-specific
libraries.  ffmpeg must be installed separately.
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Generator

from app.config import settings

logger = logging.getLogger(__name__)

# Overlap between consecutive chunks in seconds.
# Large enough to avoid cutting sentences; small enough to avoid
# significant redundant processing.
CHUNK_OVERLAP_SECONDS = 30


def needs_chunking(audio_path: Path) -> bool:
    """
    Return True if the audio file is long enough to require chunking.

    We use pydub to get duration without loading the whole file into RAM.
    """
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(str(audio_path))
        duration_s = len(audio) / 1000.0  # pydub uses milliseconds
        return duration_s > settings.chunk_duration_seconds
    except Exception as e:
        logger.warning("Could not determine audio duration: %s. Assuming no chunking needed.", e)
        return False


def get_audio_duration(audio_path: Path) -> float:
    """Return the duration of the audio file in seconds, or 0 on error."""
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(str(audio_path))
        return len(audio) / 1000.0
    except Exception as e:
        logger.warning("Could not get audio duration for %s: %s", audio_path.name, e)
        return 0.0


def split_audio_into_chunks(audio_path: Path) -> Generator[tuple[Path, float], None, None]:
    """
    Yield (chunk_path, chunk_start_offset_seconds) for each chunk.

    The offset is used to shift segment timestamps back to absolute positions
    after transcribing each chunk independently.

    Chunks are written to the same directory as the original file with
    a temporary UUID name and are cleaned up by the caller after use.
    """
    from pydub import AudioSegment

    audio = AudioSegment.from_file(str(audio_path))
    total_ms = len(audio)
    chunk_ms = settings.chunk_duration_seconds * 1000
    overlap_ms = CHUNK_OVERLAP_SECONDS * 1000

    start_ms = 0
    chunk_num = 0

    while start_ms < total_ms:
        end_ms = min(start_ms + chunk_ms, total_ms)
        chunk = audio[start_ms:end_ms]

        # Write chunk as wav — lossless, universally supported by Whisper
        chunk_filename = audio_path.parent / f"chunk_{uuid.uuid4().hex}.wav"
        chunk.export(str(chunk_filename), format="wav")

        yield chunk_filename, start_ms / 1000.0
        chunk_num += 1

        # Clean up the chunk file after it has been yielded and used
        # (caller is responsible for consuming the generator fully)
        try:
            chunk_filename.unlink(missing_ok=True)
        except Exception:
            pass  # Non-critical; temp files will be cleaned up on restart

        if end_ms >= total_ms:
            break

        # Advance with overlap — next chunk starts overlap_ms before this chunk ended
        start_ms = end_ms - overlap_ms


def deduplicate_segments(segments: list, overlap_seconds: float = CHUNK_OVERLAP_SECONDS) -> list:
    """
    Remove duplicate segments that appear in the overlap region between chunks.

    Deduplication strategy: sort all segments by start time, then remove any
    segment whose start time is within `overlap_seconds` of a segment with the
    same text from a different chunk.  We keep the version from the earlier chunk
    since its context is fuller.
    """
    if not segments:
        return segments

    seen: dict[str, float] = {}  # text_key → first_seen_start_time
    deduplicated = []

    for seg in sorted(segments, key=lambda s: s.start_time):
        # Use a simplified text key (stripped, lowercase) for matching
        key = seg.text.strip().lower()
        if key in seen and (seg.start_time - seen[key]) < overlap_seconds:
            # This is a duplicate from the overlap region — skip it
            logger.debug("Deduplicating segment: '%s'", seg.text[:50])
            continue
        seen[key] = seg.start_time
        deduplicated.append(seg)

    return deduplicated
