"""
Jobs router — status polling endpoint.

GET /jobs/{job_id}
  Returns the current status, progress message, and percentage for a job.
  The frontend polls this every 2 seconds while the job is in progress.

We deliberately keep this response lightweight (no transcript or summary data)
so that polling is cheap — those are fetched once on the results page.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ProcessingJob
from app.schemas import JobStatus as JobStatusSchema

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=JobStatusSchema)
def get_job_status(job_id: int, db: Session = Depends(get_db)) -> JobStatusSchema:
    """
    Poll the current status of a processing job.

    Called by the frontend every 2 seconds from the StatusPage.
    Returns progress_percent (0–100) and progress_message for display.
    """
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found.",
        )
    return job
