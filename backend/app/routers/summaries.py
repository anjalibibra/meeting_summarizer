"""
Results router — transcript and structured summary retrieval.

GET /results/{job_id}
  Returns the full transcript (with speaker labels, confidence flags) and
  structured summary (action items, decisions, verification flags) in a
  single response.

  Combined in one response to avoid the frontend making 2-3 serial requests
  to assemble the results page.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import JobStatus, MeetingSummary, ProcessingJob, Transcript
from app.schemas import (
    ActionItem,
    JobStatus as JobStatusSchema,
    KeyDecision,
    MeetingResults,
    SummaryOut,
    TranscriptOut,
    TranscriptSegmentOut,
    VerificationFlag,
)

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/{job_id}", response_model=MeetingResults)
def get_results(job_id: int, db: Session = Depends(get_db)) -> MeetingResults:
    """
    Return the complete results for a finished job.

    If the job is still processing, returns the job status with
    transcript=None and summary=None so the frontend can detect this
    and redirect to the status page.
    """
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found.",
        )

    job_schema = JobStatusSchema.model_validate(job)

    if job.status != JobStatus.COMPLETED:
        return MeetingResults(job=job_schema)

    # Fetch transcript
    transcript_row = (
        db.query(Transcript).filter(Transcript.job_id == job_id).first()
    )
    transcript_schema = None
    if transcript_row:
        segments = [
            TranscriptSegmentOut(
                id=s.id,
                start_time=s.start_time,
                end_time=s.end_time,
                text=s.text,
                speaker=s.speaker,
                speaker_confidence=s.speaker_confidence,
                transcription_confidence=s.transcription_confidence,
                is_low_confidence=bool(s.is_low_confidence),
            )
            for s in transcript_row.segments
        ]
        transcript_schema = TranscriptOut(
            id=transcript_row.id,
            num_speakers=transcript_row.num_speakers,
            diarization_available=bool(transcript_row.diarization_available),
            full_text=transcript_row.full_text,
            segments=segments,
        )

    # Fetch summary
    summary_row = (
        db.query(MeetingSummary).filter(MeetingSummary.job_id == job_id).first()
    )
    summary_schema = None
    if summary_row:
        # Coerce JSON columns to typed Pydantic models
        decisions = [
            KeyDecision(
                decision=d.get("decision", ""),
                rationale=d.get("rationale"),
            )
            for d in (summary_row.key_decisions or [])
            if isinstance(d, dict)
        ]
        actions = [
            ActionItem(
                task=a.get("task", ""),
                owner=a.get("owner", "unassigned"),
                deadline=a.get("deadline", "not specified"),
                priority=a.get("priority", "medium"),
            )
            for a in (summary_row.action_items or [])
            if isinstance(a, dict)
        ]
        open_qs = [
            str(q) for q in (summary_row.open_questions or [])
        ]
        flags = [
            VerificationFlag(
                item_type=f.get("item_type", "other"),
                item_text=f.get("item_text", ""),
                flag_reason=f.get("flag_reason", ""),
                confidence=f.get("confidence", "uncertain"),
            )
            for f in (summary_row.verification_flags or [])
            if isinstance(f, dict)
        ]
        summary_schema = SummaryOut(
            id=summary_row.id,
            executive_summary=summary_row.executive_summary,
            key_decisions=decisions,
            action_items=actions,
            open_questions=open_qs,
            verification_flags=flags,
        )

    return MeetingResults(
        job=job_schema,
        transcript=transcript_schema,
        summary=summary_schema,
    )
