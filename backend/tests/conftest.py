"""
Shared test fixtures.

Audio fixtures:
  - synthetic_wav_path: a tiny (3-second, 440 Hz sine wave) WAV file
    generated entirely in Python using the stdlib `wave` module.
    No real recordings are committed.  The file is created in a temp
    directory and cleaned up after the test session.

ASR fixtures:
  - mock_asr_result: a deterministic ASRResult with known segments,
    used to test pipeline logic without loading Whisper.
"""

from __future__ import annotations

import math
import struct
import tempfile
import wave
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.services.asr.base import ASRResult, ASRSegment


# ── Synthetic audio fixture ───────────────────────────────────────────────────

def _generate_sine_wav(path: Path, duration_s: float = 3.0, freq: float = 440.0) -> Path:
    """
    Write a minimal valid WAV file containing a sine wave tone.

    Uses only the stdlib `wave` module — no audio libraries required.
    The file is valid audio that pydub/Whisper can open, but contains
    only a test tone rather than speech.
    """
    sample_rate = 16000  # 16 kHz — Whisper's expected sample rate
    n_samples = int(sample_rate * duration_s)
    amplitude = 16000  # Moderate amplitude; not silence, not clipping

    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)       # Mono
        wf.setsampwidth(2)       # 16-bit
        wf.setframerate(sample_rate)
        for i in range(n_samples):
            sample = int(amplitude * math.sin(2 * math.pi * freq * i / sample_rate))
            wf.writeframes(struct.pack("<h", sample))

    return path


@pytest.fixture(scope="session")
def synthetic_wav_path(tmp_path_factory) -> Path:
    """
    Session-scoped fixture: creates a 3-second 440 Hz sine WAV.

    Session scope means it is created once per test run, not per test,
    since WAV generation is slightly slow.
    """
    tmp = tmp_path_factory.mktemp("audio")
    wav_path = tmp / "test_tone.wav"
    return _generate_sine_wav(wav_path, duration_s=3.0)


@pytest.fixture(scope="session")
def silent_wav_path(tmp_path_factory) -> Path:
    """
    Session-scoped fixture: a 2-second WAV of pure silence (all zeros).
    Used to test the "no speech detected" edge case.
    """
    tmp = tmp_path_factory.mktemp("audio")
    wav_path = tmp / "test_silence.wav"
    sample_rate = 16000
    n_samples = int(sample_rate * 2.0)

    with wave.open(str(wav_path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(b"\x00\x00" * n_samples)

    return wav_path


# ── Mock ASR result fixture ───────────────────────────────────────────────────

@pytest.fixture
def mock_asr_result() -> ASRResult:
    """
    Deterministic ASRResult with two speakers and known content.

    Mirrors the StubASRProvider output for consistency.
    """
    return ASRResult(
        segments=[
            ASRSegment(
                start_time=0.0,
                end_time=5.0,
                text="We should launch the new feature next Friday.",
                confidence=0.92,
                words=[
                    {"word": "We", "start": 0.0, "end": 0.5, "probability": 0.95},
                    {"word": "should", "start": 0.5, "end": 1.0, "probability": 0.93},
                    {"word": "launch", "start": 1.0, "end": 1.5, "probability": 0.91},
                ],
            ),
            ASRSegment(
                start_time=5.5,
                end_time=10.0,
                text="Alice will handle the deployment. Bob will write the tests.",
                confidence=0.88,
                words=[],
            ),
            ASRSegment(
                start_time=10.5,
                end_time=15.0,
                text="We decided to skip the staging environment this time.",
                confidence=0.45,  # Below LOW_CONFIDENCE_THRESHOLD (0.6) → flagged
                words=[],
            ),
        ],
        detected_language="en",
        has_speech=True,
    )


# ── App client fixture ────────────────────────────────────────────────────────

@pytest.fixture
def client():
    """
    FastAPI TestClient using an in-memory SQLite database.

    Overrides DATABASE_URL and ASR_PROVIDER/LLM_PROVIDER to stubs so no
    models are loaded and no API calls are made during tests.
    """
    # Patch settings before importing the app
    import os
    env_overrides = {
        "DATABASE_URL": "sqlite:///:memory:",
        "ASR_PROVIDER": "stub",
        "LLM_PROVIDER": "stub",
    }

    with patch.dict(os.environ, env_overrides):
        # Re-import settings with overridden env
        from importlib import reload
        import app.config as config_module
        reload(config_module)

        from fastapi.testclient import TestClient
        from app.main import app
        from app.database import create_all_tables
        create_all_tables()

        with TestClient(app) as c:
            yield c
