"""
Application configuration loaded from environment variables.

We use pydantic-settings so that every setting is type-checked
at startup and missing required variables fail loudly rather than
surfacing as cryptic runtime errors later.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path
from typing import Literal


class Settings(BaseSettings):
    # ── Database ────────────────────────────────────────────────────────────
    # Default to SQLite for local development; swap to a postgres:// URL in
    # production.  SQLAlchemy's dialect-agnostic engine means no code changes
    # are required — only this env var.
    database_url: str = Field(
        default="sqlite:///./meeting_summarizer.db",
        description="SQLAlchemy database URL. Use sqlite:/// or postgresql+asyncpg://",
    )

    # ── LLM ─────────────────────────────────────────────────────────────────
    llm_provider: Literal["openai", "anthropic", "stub"] = Field(
        default="openai",
        description="Which LLM provider to use. 'stub' returns deterministic fake output for tests.",
    )
    llm_api_key: str = Field(
        default="sk-placeholder",
        description="API key for the chosen LLM provider.",
    )
    llm_model: str = Field(
        default="gpt-4o-mini",
        description="Model name passed to the provider API.",
    )
    llm_temperature: float = Field(
        default=0.2,
        description="Lower temperature → more deterministic, less creative summaries.",
    )

    # ── ASR ─────────────────────────────────────────────────────────────────
    asr_provider: Literal["whisper", "faster_whisper", "stub"] = Field(
        default="whisper",
        description="ASR backend.  'faster_whisper' is faster on CPU; 'stub' for tests.",
    )
    whisper_model_size: Literal["tiny", "base", "small", "medium", "large"] = Field(
        default="base",
        description="Whisper model size. Larger = better accuracy but slower + more RAM.",
    )

    # ── File handling ────────────────────────────────────────────────────────
    upload_dir: Path = Field(
        default=Path("uploads"),
        description="Directory where uploaded audio files are stored.",
    )
    max_upload_mb: int = Field(
        default=500,
        description="Maximum allowed upload size in megabytes.",
    )
    # Chunk size used when splitting very long audio to avoid OOM / timeouts.
    # 10 minutes is a practical balance for base-sized Whisper on consumer hardware.
    chunk_duration_seconds: int = Field(
        default=600,
        description="Duration of each audio chunk when splitting long recordings.",
    )

    # ── Confidence thresholds ────────────────────────────────────────────────
    # Below this word-level probability, a segment is marked "low confidence"
    # in the transcript and surfaced visually to the user rather than hidden.
    low_confidence_threshold: float = Field(
        default=0.6,
        description="Whisper word probability below which a segment is flagged.",
    )
    # Speaker diarization confidence: below this, we label "uncertain speaker"
    # instead of assigning a specific speaker label, to avoid silent mistakes.
    diarization_confidence_threshold: float = Field(
        default=0.7,
        description="Speaker diarization score below which we label 'uncertain speaker'.",
    )

    # ── CORS ─────────────────────────────────────────────────────────────────
    cors_origins: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origins for the frontend dev server.",
    )

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


# Singleton — import this from anywhere in the app
settings = Settings()

# Ensure the upload directory exists at startup
settings.upload_dir.mkdir(parents=True, exist_ok=True)
