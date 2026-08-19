"""
FastAPI application entry point.

Startup sequence:
  1. Create database tables (idempotent — safe to run on every start)
  2. Mount routers
  3. Configure CORS for the frontend dev server

The application is intentionally small.  Global state is limited to
the database engine and the singleton model instances (ASR, diarization)
which are lazily loaded on first use to avoid slow startup in development.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_all_tables
from app.routers import jobs, summaries, upload

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks before serving requests."""
    logger.info("Starting Meeting Summarizer API…")
    create_all_tables()
    logger.info("Database tables ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Meeting Summarizer API",
    description=(
        "Transcribes meeting audio and generates structured, action-oriented summaries "
        "with speaker diarization and LLM-powered verification."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the React dev server (port 5173) and any configured origins.
# In production, restrict this to your actual frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(upload.router)
app.include_router(jobs.router)
app.include_router(summaries.router)


@app.get("/health", tags=["health"])
def health_check() -> dict:
    """
    Lightweight health check endpoint.
    Returns 200 immediately without touching the database or loading models.
    Useful for container readiness probes.
    """
    return {"status": "ok", "version": "1.0.0"}
