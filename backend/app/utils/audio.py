"""
Audio input validation utilities.

Centralising validation here — rather than inline in the router — means
the same rules apply regardless of how the file arrives (HTTP upload,
CLI tool, future S3 trigger). It also makes tests straightforward since
there is no FastAPI dependency.
"""

from __future__ import annotations

import os
from pathlib import Path

# Allowed MIME types and their corresponding extensions.
# We check both the Content-Type header (from the client) AND the actual
# file bytes (magic number) to guard against extension spoofing.
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".mp4", ".ogg", ".flac", ".webm"}

# Magic byte signatures for supported audio formats.
# Checking file bytes prevents accepting a renamed .exe as a .mp3.
AUDIO_MAGIC_BYTES: dict[bytes, str] = {
    b"ID3": "mp3",           # MP3 with ID3 tag
    b"\xff\xfb": "mp3",      # MP3 without ID3 (sync word)
    b"\xff\xf3": "mp3",
    b"\xff\xf2": "mp3",
    b"RIFF": "wav",           # WAV (RIFF header, 4 bytes then "WAVE")
    b"fLaC": "flac",
    b"OggS": "ogg",
}
# M4A / MP4 have "ftyp" at byte offset 4 — handled separately below


class AudioValidationError(ValueError):
    """Raised when an uploaded file fails validation."""
    pass


def validate_extension(filename: str) -> str:
    """
    Check that the filename has an allowed extension.

    Returns the extension (lowercased) on success.
    Raises AudioValidationError on failure.
    """
    suffix = Path(filename).suffix.lower()
    if not suffix:
        raise AudioValidationError(f"File '{filename}' has no extension.")
    if suffix not in ALLOWED_EXTENSIONS:
        raise AudioValidationError(
            f"File extension '{suffix}' is not supported. "
            f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    return suffix


def validate_file_size(file_path: Path, max_mb: int) -> int:
    """
    Confirm the file does not exceed max_mb.

    Returns file size in bytes on success.
    Raises AudioValidationError if too large.
    """
    size = os.path.getsize(file_path)
    max_bytes = max_mb * 1024 * 1024
    if size > max_bytes:
        raise AudioValidationError(
            f"File size {size / (1024**2):.1f} MB exceeds the {max_mb} MB limit."
        )
    if size == 0:
        raise AudioValidationError("Uploaded file is empty.")
    return size


def validate_audio_magic_bytes(file_path: Path) -> None:
    """
    Read the first 12 bytes of the file and confirm it looks like audio.

    This is a lightweight sanity check — not a full format validation.
    The goal is to reject obviously wrong files (PDFs, executables) without
    running Whisper and getting a confusing error message.

    Raises AudioValidationError if the file doesn't match any known audio signature.
    """
    with open(file_path, "rb") as f:
        header = f.read(12)

    # Check standard magic bytes at offset 0
    for magic, fmt in AUDIO_MAGIC_BYTES.items():
        if header[: len(magic)] == magic:
            return  # Recognised

    # M4A / MP4: "ftyp" box appears at bytes 4–7
    if len(header) >= 8 and header[4:8] == b"ftyp":
        return  # Recognised as MP4/M4A container

    # WAV alternative: RIFF at offset 0, "WAVE" at offset 8
    if len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WAVE":
        return

    raise AudioValidationError(
        "File does not appear to be a valid audio file. "
        "Please upload an MP3, WAV, M4A, FLAC, OGG, or WebM file."
    )


def validate_audio_file(file_path: Path, original_filename: str, max_mb: int) -> int:
    """
    Run all validation checks on an uploaded audio file.

    Returns file size in bytes.
    Raises AudioValidationError on any failure.
    """
    validate_extension(original_filename)
    size = validate_file_size(file_path, max_mb)
    validate_audio_magic_bytes(file_path)
    return size
