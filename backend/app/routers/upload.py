"""
Upload router — handles audio file ingestion.

POST /upload
  - Validates file extension, size, and magic bytes
  - Saves file with a UUID name (safe storage, no path traversal risk)
  - Creates a ProcessingJob record
  - Kicks off the pipeline as a BackgroundTask
  - Returns the job_id immediately for polling

We return immediately after accepting the file rather than waiting for
transcription to complete because transcription can take 30–120 seconds
for a typical meeting recording.
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

import aiofiles
from app.config import settings
from app.database import get_db
from app.models import JobStatus, ProcessingJob
from app.schemas import UploadResponse
from app.services.pipeline import run_pipeline
from app.utils.audio import AudioValidationError, validate_audio_file, validate_extension

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/", response_model=UploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_audio(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> UploadResponse:
    """
    Accept an audio file upload and start processing in the background.

    Returns a job_id which the client should use to poll /jobs/{job_id}
    for status updates.

    Accepted formats: mp3, wav, m4a, ogg, flac, webm
    Maximum size: configurable via MAX_UPLOAD_MB env var (default 500 MB)
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided.",
        )

    # Validate extension before writing anything to disk
    try:
        ext = validate_extension(file.filename)
    except AudioValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Use a UUID-based filename for storage — avoids collisions, path traversal,
    # and leaking the original filename in the filesystem
    safe_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = settings.upload_dir / safe_name

    # Create job record immediately so we can return a job_id
    job = ProcessingJob(
        status=JobStatus.UPLOADING,
        progress_message="Receiving file…",
        progress_percent=0.0,
        original_filename=file.filename,
        stored_filename=safe_name,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    job_id = job.id

    # Stream file to disk to avoid loading the entire file into memory
    try:
        async with aiofiles.open(dest_path, "wb") as out:
            chunk_size = 1024 * 1024  # 1 MB chunks
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                await out.write(chunk)
    except Exception as e:
        # Clean up partial file and mark job as failed
        dest_path.unlink(missing_ok=True)
        job.status = JobStatus.FAILED
        job.error_message = f"File upload failed: {e}"
        db.add(job)
        db.commit()
        logger.error("File write failed for job %d: %s", job_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File upload failed. Please try again.",
        )

    # Post-upload validation (size check, magic bytes)
    try:
        file_size = validate_audio_file(dest_path, file.filename, settings.max_upload_mb)
        job.file_size_bytes = file_size
        db.add(job)
        db.commit()
    except AudioValidationError as e:
        dest_path.unlink(missing_ok=True)
        job.status = JobStatus.FAILED
        job.error_message = str(e)
        db.add(job)
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Launch processing pipeline as a background task
    # We pass db as a new session because BackgroundTasks run after the
    # response is sent — the request-scoped session will be closed.
    from app.database import SessionLocal

    def run_with_own_session():
        pipeline_db = SessionLocal()
        try:
            run_pipeline(job_id, dest_path, pipeline_db)
        finally:
            pipeline_db.close()

    background_tasks.add_task(run_with_own_session)
    logger.info("Job %d created for file '%s'", job_id, file.filename)

    return UploadResponse(job_id=job_id)
