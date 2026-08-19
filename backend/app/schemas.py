"""
Pydantic schemas for API request/response validation.

Schemas are separate from ORM models because the shape of an API response
often differs from how data is stored (e.g., we don't expose raw LLM output
in normal responses).  This also keeps the serialization logic out of models.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Job Schemas ──────────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    """Returned immediately when a file upload begins."""
    id: int
    status: str
    original_filename: str
    created_at: datetime

    model_config = {"from_attributes": True}


class JobStatus(BaseModel):
    """
    Polling response for /jobs/{id}.

    Contains enough info for the frontend to render a meaningful progress
    indicator — not just "loading" but "Transcribing chunk 2 of 5".
    """
    id: int
    status: str
    progress_message: Optional[str] = None
    progress_percent: float = 0.0
    original_filename: str
    duration_seconds: Optional[float] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Transcript Schemas ───────────────────────────────────────────────────────

class TranscriptSegmentOut(BaseModel):
    id: int
    start_time: float
    end_time: float
    text: str
    speaker: Optional[str] = None
    speaker_confidence: Optional[float] = None
    transcription_confidence: Optional[float] = None
    is_low_confidence: bool = False

    model_config = {"from_attributes": True}


class TranscriptOut(BaseModel):
    id: int
    num_speakers: int
    diarization_available: bool
    full_text: Optional[str] = None
    segments: list[TranscriptSegmentOut] = []

    model_config = {"from_attributes": True}


# ── Summary Schemas ──────────────────────────────────────────────────────────

class KeyDecision(BaseModel):
    """A decision made during the meeting with an optional one-line rationale."""
    decision: str
    rationale: Optional[str] = None


class ActionItem(BaseModel):
    """
    A concrete task arising from the meeting.

    Priority is inferred from tone/context by the LLM rather than extracted
    from explicit statements, because most meetings don't assign priorities
    explicitly.  We surface this as-is with the verification flag if doubtful.
    """
    task: str
    owner: str = Field(default="unassigned")
    deadline: str = Field(default="not specified")
    priority: str = Field(default="medium", pattern="^(high|medium|low)$")


class VerificationFlag(BaseModel):
    """
    Result of the second LLM verification pass.

    item_type: "action_item" | "decision" | "other"
    confidence: "supported" | "uncertain" | "likely_hallucinated"
    """
    item_type: str
    item_text: str
    flag_reason: str
    confidence: str


class SummaryOut(BaseModel):
    id: int
    executive_summary: Optional[str] = None
    key_decisions: list[KeyDecision] = []
    action_items: list[ActionItem] = []
    open_questions: list[str] = []
    verification_flags: list[VerificationFlag] = []

    model_config = {"from_attributes": True}


# ── Full Results Schema ───────────────────────────────────────────────────────

class MeetingResults(BaseModel):
    """
    Combined response for the results page — avoids the frontend making
    separate calls for transcript and summary.
    """
    job: JobStatus
    transcript: Optional[TranscriptOut] = None
    summary: Optional[SummaryOut] = None


# ── Upload Response ──────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    job_id: int
    message: str = "File uploaded successfully. Processing has started."
