"""
Tests for audio input validation utilities.

Audio fixture: a tiny synthetic WAV generated entirely from stdlib `wave`.
No real recordings are used or committed.
"""

from __future__ import annotations

import struct
import wave
from pathlib import Path

import pytest

from app.utils.audio import (
    AudioValidationError,
    validate_audio_file,
    validate_audio_magic_bytes,
    validate_extension,
    validate_file_size,
)


# ── Extension validation ──────────────────────────────────────────────────────

class TestValidateExtension:
    def test_accepts_mp3(self):
        assert validate_extension("meeting.mp3") == ".mp3"

    def test_accepts_wav(self):
        assert validate_extension("recording.wav") == ".wav"

    def test_accepts_m4a(self):
        assert validate_extension("audio.m4a") == ".m4a"

    def test_accepts_case_insensitive(self):
        assert validate_extension("MEETING.MP3") == ".mp3"

    def test_rejects_pdf(self):
        with pytest.raises(AudioValidationError, match="not supported"):
            validate_extension("document.pdf")

    def test_rejects_exe(self):
        with pytest.raises(AudioValidationError, match="not supported"):
            validate_extension("evil.exe")

    def test_rejects_no_extension(self):
        with pytest.raises(AudioValidationError, match="no extension"):
            validate_extension("audiofile")

    def test_rejects_dot_only(self):
        with pytest.raises(AudioValidationError, match="no extension"):
            validate_extension("file.")


# ── File size validation ──────────────────────────────────────────────────────

class TestValidateFileSize:
    def test_accepts_normal_file(self, synthetic_wav_path):
        """Synthetic WAV is a few KB — well within limit."""
        size = validate_file_size(synthetic_wav_path, max_mb=1)
        assert size > 0

    def test_rejects_oversized_file(self, tmp_path):
        """Create a file that exceeds the 1 MB limit."""
        big_file = tmp_path / "big.wav"
        big_file.write_bytes(b"\x00" * (2 * 1024 * 1024))  # 2 MB
        with pytest.raises(AudioValidationError, match="exceeds"):
            validate_file_size(big_file, max_mb=1)

    def test_rejects_empty_file(self, tmp_path):
        empty = tmp_path / "empty.wav"
        empty.write_bytes(b"")
        with pytest.raises(AudioValidationError, match="empty"):
            validate_file_size(empty, max_mb=100)


# ── Magic byte validation ─────────────────────────────────────────────────────

class TestValidateAudioMagicBytes:
    def test_accepts_valid_wav(self, synthetic_wav_path):
        """Synthetic WAV has RIFF+WAVE header — should pass."""
        validate_audio_magic_bytes(synthetic_wav_path)  # No exception

    def test_rejects_pdf_bytes(self, tmp_path):
        """PDF starts with %PDF — should fail."""
        fake = tmp_path / "fake.wav"
        fake.write_bytes(b"%PDF-1.4 fake content here")
        with pytest.raises(AudioValidationError, match="does not appear to be"):
            validate_audio_magic_bytes(fake)

    def test_rejects_executable_bytes(self, tmp_path):
        """Windows PE starts with MZ — should fail."""
        fake = tmp_path / "fake.wav"
        fake.write_bytes(b"MZ\x90\x00" + b"\x00" * 20)
        with pytest.raises(AudioValidationError):
            validate_audio_magic_bytes(fake)

    def test_accepts_mp3_id3_header(self, tmp_path):
        """MP3 with ID3 tag starts with 'ID3'."""
        mp3_like = tmp_path / "test.mp3"
        mp3_like.write_bytes(b"ID3" + b"\x00" * 20)
        validate_audio_magic_bytes(mp3_like)  # No exception

    def test_accepts_m4a_ftyp_box(self, tmp_path):
        """M4A/MP4 has 'ftyp' at bytes 4–7."""
        m4a_like = tmp_path / "test.m4a"
        m4a_like.write_bytes(b"\x00\x00\x00\x20ftyp" + b"M4A " + b"\x00" * 16)
        validate_audio_magic_bytes(m4a_like)  # No exception


# ── Full validation pipeline ──────────────────────────────────────────────────

class TestValidateAudioFile:
    def test_valid_wav_passes_all_checks(self, synthetic_wav_path):
        size = validate_audio_file(synthetic_wav_path, "recording.wav", max_mb=100)
        assert size > 0

    def test_bad_extension_fails_early(self, synthetic_wav_path):
        """Even a valid WAV file should fail if named .pdf."""
        with pytest.raises(AudioValidationError, match="not supported"):
            validate_audio_file(synthetic_wav_path, "meeting.pdf", max_mb=100)
