"""
Pipeline orchestrator — the core of the application.

Coordinates the full processing flow for a single uploaded audio file:
  1. Update job status at each stage (frontend polls this)
  2. Audio duration check → chunking decision
  3. ASR: per-chunk for long audio, full-file for short audio
  4. Deduplication of overlap segments
  5. Diarization: ALWAYS on the full original file (not per-chunk)
     — this is essential for consistent speaker IDs across chunk boundaries
  6. Confidence flagging of transcript segments
  7. LLM summarization pass
  8. LLM verification pass
  9. Persist everything to the database

Design decisions:
  - This runs in a FastAPI BackgroundTask thread (not async) because
    Whisper inference is CPU-bound; async would not help and would add
    complexity with no benefit.
  - Each stage updates job.progress_percent and job.progress_message so
    the frontend gets meaningful status instead of just a spinner.
  - Failures at any stage mark the job as FAILED with an error message
    rather than silently returning empty results.
"""

from __future__ import annotations

import logging
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import settings
from app.models import JobStatus, MeetingSummary, ProcessingJob, Transcript, TranscriptSegment
from app.services.asr.base import ASRResult, ASRSegment
from app.services.asr.whisper import get_asr_provider
from app.services.chunker import (
    deduplicate_segments,
    get_audio_duration,
    needs_chunking,
    split_audio_into_chunks,
)
from app.services.diarization import DiarizationService
from app.services.llm import LLMError, summarize_transcript, verify_summary
from app.utils.confidence import is_low_confidence_segment

logger = logging.getLogger(__name__)

# Singleton providers — loaded once, reused across all pipeline runs
_asr_provider = None
_diarization_service = None


def _get_asr():
    global _asr_provider
    if _asr_provider is None:
        _asr_provider = get_asr_provider()
    return _asr_provider


def _get_diarization():
    global _diarization_service
    if _diarization_service is None:
        _diarization_service = DiarizationService()
    return _diarization_service


def _update_job(
    db: Session,
    job: ProcessingJob,
    status: JobStatus,
    message: str,
    percent: float,
) -> None:
    """Persist a job status update and flush immediately so the poller sees it."""
    job.status = status
    job.progress_message = message
    job.progress_percent = percent
    db.add(job)
    db.commit()
    db.refresh(job)
    logger.info("[job=%d] %s (%.0f%%)", job.id, message, percent)


def run_pipeline(job_id: int, audio_path: Path, db: Session) -> None:
    """
    Full pipeline: ASR → diarization → LLM summarize → LLM verify → save.

    This is the background task entry point.  All errors are caught and
    stored on the job so the frontend can display them.
    """
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        logger.error("Pipeline called with unknown job_id=%d", job_id)
        return

    try:
        _run(job, audio_path, db)
    except Exception as e:
        logger.exception("Pipeline failed for job %d: %s", job_id, e)
        job.status = JobStatus.FAILED
        job.error_message = str(e)
        job.progress_percent = 0.0
        db.add(job)
        db.commit()


def _run(job: ProcessingJob, audio_path: Path, db: Session) -> None:
    """Internal pipeline — raises on unrecoverable errors."""

    # ── Stage 1: Duration check ─────────────────────────────────────────────
    _update_job(db, job, JobStatus.TRANSCRIBING, "Analysing audio file…", 5.0)
    duration = get_audio_duration(audio_path)
    job.duration_seconds = duration
    db.add(job)
    db.commit()

    # ── Stage 2: ASR (chunked or full) ──────────────────────────────────────
    asr = _get_asr()

    if needs_chunking(audio_path):
        asr_result = _transcribe_chunked(job, audio_path, db, asr)
    else:
        _update_job(db, job, JobStatus.TRANSCRIBING, "Transcribing audio…", 20.0)
        asr_result = asr.transcribe(audio_path)

    # Handle silence / no speech edge case gracefully
    if not asr_result.has_speech or not asr_result.segments:
        _save_empty_transcript(job, db, "No speech detected in audio.")
        _update_job(db, job, JobStatus.COMPLETED, "Completed — no speech detected.", 100.0)
        return

    # ── Stage 3: Diarization — on full file, not per-chunk ──────────────────
    # Running on the FULL file ensures speaker IDs are globally consistent.
    # If we ran per-chunk, SPEAKER_00 in chunk 1 may not be the same person
    # as SPEAKER_00 in chunk 2.
    _update_job(db, job, JobStatus.DIARIZING, "Identifying speakers…", 55.0)
    diarization_svc = _get_diarization()
    labelled_segments, num_speakers = diarization_svc.diarize(audio_path, asr_result)

    # ── Stage 4: Confidence flagging ─────────────────────────────────────────
    # Mark segments that fall below the configured threshold so the frontend
    # can highlight them without hiding them from the user.
    for seg in labelled_segments:
        seg.__dict__["is_low_confidence"] = is_low_confidence_segment(seg.confidence)

    # ── Stage 5: Build full transcript text for LLM ──────────────────────────
    full_text = _build_transcript_text(labelled_segments)

    # ── Stage 6: Persist transcript to database ──────────────────────────────
    _update_job(db, job, JobStatus.SUMMARIZING, "Generating structured summary…", 65.0)
    transcript_row = _save_transcript(job, labelled_segments, num_speakers, full_text, diarization_svc.is_available, db)

    # ── Stage 7: LLM summarization pass ──────────────────────────────────────
    try:
        summary_data = summarize_transcript(full_text, duration)
    except LLMError as e:
        logger.error("Summarization failed for job %d: %s", job.id, e)
        _update_job(db, job, JobStatus.FAILED, f"Summarization failed: {e}", 0.0)
        job.error_message = str(e)
        db.add(job)
        db.commit()
        return

    # ── Stage 8: LLM verification pass ───────────────────────────────────────
    _update_job(db, job, JobStatus.VERIFYING, "Verifying summary against transcript…", 85.0)
    verification_data = verify_summary(full_text, summary_data)

    # ── Stage 9: Persist summary ──────────────────────────────────────────────
    _save_summary(job, summary_data, verification_data, db)

    # ── Done ──────────────────────────────────────────────────────────────────
    _update_job(db, job, JobStatus.COMPLETED, "Processing complete.", 100.0)


def _transcribe_chunked(
    job: ProcessingJob,
    audio_path: Path,
    db: Session,
    asr,
) -> ASRResult:
    """
    Transcribe a long audio file in chunks and merge the results.

    Chunks are processed sequentially (not in parallel) to avoid exhausting
    RAM on machines without a GPU.  Each chunk's timestamps are offset by its
    start position so all segments are in absolute time.
    """
    # Estimate chunk count for progress reporting
    duration = job.duration_seconds or 0
    chunk_duration = settings.chunk_duration_seconds
    estimated_chunks = max(1, int(duration / chunk_duration) + 1)

    all_segments: list[ASRSegment] = []
    chunk_num = 0
    detected_language = None

    for chunk_path, offset_s in split_audio_into_chunks(audio_path):
        chunk_num += 1
        progress = 20.0 + (chunk_num / estimated_chunks) * 30.0  # 20–50%
        _update_job(
            db,
            job,
            JobStatus.TRANSCRIBING,
            f"Transcribing chunk {chunk_num} of ~{estimated_chunks}…",
            progress,
        )

        result = asr.transcribe(chunk_path)
        if detected_language is None:
            detected_language = result.detected_language

        # Shift timestamps from chunk-relative to absolute
        for seg in result.segments:
            seg.start_time += offset_s
            seg.end_time += offset_s
            all_segments.append(seg)

    # Remove duplicate segments from overlap regions
    all_segments = deduplicate_segments(all_segments)

    has_speech = any(seg.text.strip() for seg in all_segments)
    return ASRResult(
        segments=all_segments,
        detected_language=detected_language,
        has_speech=has_speech,
    )


def _build_transcript_text(segments: list) -> str:
    """
    Produce a readable speaker-labelled transcript for LLM input.

    Format:
        Speaker 1: Text of what they said.
        Speaker 2: Their response.

    This format is familiar to LLMs from training data and produces
    better summarization than raw timestamp-prefixed formats.
    """
    lines = []
    for seg in segments:
        speaker = seg.__dict__.get("speaker") or "Unknown"
        text = seg.text.strip()
        if text:
            lines.append(f"{speaker}: {text}")
    return "\n".join(lines)


def _save_transcript(
    job: ProcessingJob,
    segments: list,
    num_speakers: int,
    full_text: str,
    diarization_available: bool,
    db: Session,
) -> Transcript:
    """Persist transcript and all segments to the database."""
    transcript = Transcript(
        job_id=job.id,
        num_speakers=num_speakers,
        diarization_available=int(diarization_available),
        full_text=full_text,
    )
    db.add(transcript)
    db.flush()  # Get transcript.id without committing

    for idx, seg in enumerate(segments):
        seg_row = TranscriptSegment(
            transcript_id=transcript.id,
            start_time=seg.start_time,
            end_time=seg.end_time,
            text=seg.text.strip(),
            speaker=seg.__dict__.get("speaker"),
            speaker_confidence=seg.__dict__.get("speaker_confidence"),
            transcription_confidence=seg.confidence,
            is_low_confidence=int(seg.__dict__.get("is_low_confidence", False)),
            chunk_index=0,  # Already merged; chunk index no longer meaningful
        )
        db.add(seg_row)

    db.commit()
    db.refresh(transcript)
    return transcript


def _save_summary(
    job: ProcessingJob,
    summary_data: dict,
    verification_data: dict,
    db: Session,
) -> MeetingSummary:
    """Persist the structured summary and verification flags."""
    summary = MeetingSummary(
        job_id=job.id,
        executive_summary=summary_data.get("executive_summary", ""),
        key_decisions=summary_data.get("key_decisions", []),
        action_items=summary_data.get("action_items", []),
        open_questions=summary_data.get("open_questions", []),
        raw_llm_response=summary_data.get("raw_llm_response", ""),
        verification_flags=verification_data.get("verification_flags", []),
        raw_verification_response=verification_data.get("raw_verification_response", ""),
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


def _save_empty_transcript(job: ProcessingJob, db: Session, note: str) -> None:
    """Persist an empty transcript record for a silent/empty audio file."""
    transcript = Transcript(
        job_id=job.id,
        num_speakers=0,
        diarization_available=0,
        full_text="",
    )
    db.add(transcript)
    db.commit()
