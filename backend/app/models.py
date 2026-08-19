"""
ORM models — the source of truth for database schema.

Naming conventions follow SQLAlchemy best practices so that Alembic
auto-migrations (if added later) generate clean migration scripts.

JSON columns: SQLAlchemy's JSON type maps to TEXT in SQLite and JSONB
in Postgres — no code changes needed when swapping databases.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class JobStatus(str, enum.Enum):
    """
    Lifecycle states for a processing job.

    We use a string enum so that the raw database value is human-readable
    and safe to expose directly in API responses without an extra mapping step.
    """
    PENDING = "pending"           # Job created, not yet started
    UPLOADING = "uploading"       # File is being received
    TRANSCRIBING = "transcribing" # ASR in progress
    DIARIZING = "diarizing"       # Speaker labelling in progress
    SUMMARIZING = "summarizing"   # LLM summarization in progress
    VERIFYING = "verifying"       # Second LLM pass checking for hallucinations
    COMPLETED = "completed"       # All done
    FAILED = "failed"             # Unrecoverable error


class ProcessingJob(Base):
    """
    Tracks a single audio file through the full processing pipeline.

    One row per uploaded file. The frontend polls /jobs/{id} to get
    the current status and progress message.
    """
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING, nullable=False)
    # Human-readable progress message shown to the user (e.g. "Transcribing chunk 2/5")
    progress_message = Column(String(500), nullable=True)
    # Progress as 0–100 percent for the progress bar
    progress_percent = Column(Float, default=0.0, nullable=False)

    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)  # UUID-based safe name
    file_size_bytes = Column(Integer, nullable=True)
    duration_seconds = Column(Float, nullable=True)

    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship: a job has at most one transcript and one summary
    transcript = relationship("Transcript", back_populates="job", uselist=False, cascade="all, delete-orphan")
    summary = relationship("MeetingSummary", back_populates="job", uselist=False, cascade="all, delete-orphan")


class TranscriptSegment(Base):
    """
    A single timed segment in the transcript.

    Stored as individual rows rather than a single JSON blob so that
    future features (search, segment-level editing) are straightforward.
    """
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True, index=True)
    transcript_id = Column(Integer, ForeignKey("transcripts.id"), nullable=False, index=True)

    start_time = Column(Float, nullable=False)  # seconds
    end_time = Column(Float, nullable=False)    # seconds
    text = Column(Text, nullable=False)

    # Speaker label: "Speaker 1", "Speaker 2", or "uncertain speaker"
    speaker = Column(String(100), nullable=True)
    # Diarization confidence score [0, 1]; None if diarization unavailable
    speaker_confidence = Column(Float, nullable=True)

    # Whisper avg word probability for this segment.  Below the configured
    # threshold this segment is flagged for visual highlighting in the UI.
    transcription_confidence = Column(Float, nullable=True)
    is_low_confidence = Column(Integer, default=0, nullable=False)  # SQLite bool

    # Chunk index this segment came from (used to reconstruct ordered output
    # when audio is processed in multiple chunks)
    chunk_index = Column(Integer, default=0, nullable=False)


class Transcript(Base):
    """Full transcript for a processing job."""
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("processing_jobs.id"), nullable=False, unique=True, index=True)

    # Total detected speakers (0 if diarization unavailable)
    num_speakers = Column(Integer, default=0, nullable=False)
    # Whether diarization was available and ran successfully
    diarization_available = Column(Integer, default=0, nullable=False)

    # Full plain-text transcript for LLM input (reconstructed from segments)
    full_text = Column(Text, nullable=True)

    created_at = Column(DateTime, default=func.now(), nullable=False)

    job = relationship("ProcessingJob", back_populates="transcript")
    segments = relationship(
        "TranscriptSegment",
        backref="transcript",
        cascade="all, delete-orphan",
        order_by="TranscriptSegment.start_time",
    )


class MeetingSummary(Base):
    """
    Structured LLM-generated summary for a meeting.

    We store both the structured fields (as JSON columns) and the raw
    LLM response so we can re-parse it without re-running the LLM if
    the parsing logic is improved.
    """
    __tablename__ = "meeting_summaries"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("processing_jobs.id"), nullable=False, unique=True, index=True)

    # Structured output from the summarization LLM pass
    executive_summary = Column(Text, nullable=True)
    key_decisions: Any = Column(JSON, nullable=True)   # List[{decision, rationale}]
    action_items: Any = Column(JSON, nullable=True)    # List[{task, owner, deadline, priority}]
    open_questions: Any = Column(JSON, nullable=True)  # List[str]

    # Raw LLM response — kept for debugging and re-parsing
    raw_llm_response = Column(Text, nullable=True)

    # Output from the verification (second) LLM pass.
    # List of {item_type, item_text, flag_reason, confidence} dicts.
    verification_flags: Any = Column(JSON, nullable=True)
    raw_verification_response = Column(Text, nullable=True)

    created_at = Column(DateTime, default=func.now(), nullable=False)

    job = relationship("ProcessingJob", back_populates="summary")
