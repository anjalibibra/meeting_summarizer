"""
Tests for confidence scoring utilities.

Verifies threshold logic, None-safety, and label mapping.
These are pure unit tests with no external dependencies.
"""

from __future__ import annotations

import pytest

from app.utils.confidence import (
    compute_segment_confidence,
    confidence_label,
    is_low_confidence_segment,
    is_uncertain_speaker,
)


# ── is_low_confidence_segment ─────────────────────────────────────────────────

class TestIsLowConfidenceSegment:
    """
    Default threshold from settings is 0.6.
    We test boundary conditions and None handling.
    """

    def test_below_threshold_is_low(self, monkeypatch):
        monkeypatch.setattr("app.utils.confidence.settings.low_confidence_threshold", 0.6)
        assert is_low_confidence_segment(0.45) is True

    def test_above_threshold_is_not_low(self, monkeypatch):
        monkeypatch.setattr("app.utils.confidence.settings.low_confidence_threshold", 0.6)
        assert is_low_confidence_segment(0.85) is False

    def test_at_threshold_is_not_low(self, monkeypatch):
        """Boundary: exactly at threshold is NOT flagged (strict <)."""
        monkeypatch.setattr("app.utils.confidence.settings.low_confidence_threshold", 0.6)
        assert is_low_confidence_segment(0.6) is False

    def test_none_confidence_is_not_flagged(self, monkeypatch):
        """
        None means the provider didn't return a confidence score.
        We treat this as unknown, not as low, to avoid false positives.
        """
        monkeypatch.setattr("app.utils.confidence.settings.low_confidence_threshold", 0.6)
        assert is_low_confidence_segment(None) is False

    def test_zero_confidence_is_low(self, monkeypatch):
        monkeypatch.setattr("app.utils.confidence.settings.low_confidence_threshold", 0.6)
        assert is_low_confidence_segment(0.0) is True


# ── is_uncertain_speaker ──────────────────────────────────────────────────────

class TestIsUncertainSpeaker:
    def test_low_confidence_is_uncertain(self, monkeypatch):
        monkeypatch.setattr(
            "app.utils.confidence.settings.diarization_confidence_threshold", 0.7
        )
        assert is_uncertain_speaker(0.5) is True

    def test_high_confidence_is_not_uncertain(self, monkeypatch):
        monkeypatch.setattr(
            "app.utils.confidence.settings.diarization_confidence_threshold", 0.7
        )
        assert is_uncertain_speaker(0.9) is False

    def test_none_is_not_uncertain(self, monkeypatch):
        """
        Pyannote diarization sometimes returns no score for a segment.
        We do not flag these as uncertain to avoid false positives.
        """
        monkeypatch.setattr(
            "app.utils.confidence.settings.diarization_confidence_threshold", 0.7
        )
        assert is_uncertain_speaker(None) is False


# ── compute_segment_confidence ────────────────────────────────────────────────

class TestComputeSegmentConfidence:
    def test_mean_of_probabilities(self):
        result = compute_segment_confidence([0.8, 0.6, 1.0])
        assert abs(result - (0.8 + 0.6 + 1.0) / 3) < 1e-9

    def test_single_word(self):
        assert compute_segment_confidence([0.75]) == pytest.approx(0.75)

    def test_empty_list_returns_none(self):
        """Empty segment (silence) has no confidence — returns None."""
        assert compute_segment_confidence([]) is None

    def test_all_zeros(self):
        assert compute_segment_confidence([0.0, 0.0, 0.0]) == pytest.approx(0.0)

    def test_all_ones(self):
        assert compute_segment_confidence([1.0, 1.0, 1.0]) == pytest.approx(1.0)


# ── confidence_label ──────────────────────────────────────────────────────────

class TestConfidenceLabel:
    def test_high_label(self, monkeypatch):
        monkeypatch.setattr("app.utils.confidence.settings.low_confidence_threshold", 0.6)
        assert confidence_label(0.9) == "high"

    def test_medium_label(self, monkeypatch):
        monkeypatch.setattr("app.utils.confidence.settings.low_confidence_threshold", 0.6)
        assert confidence_label(0.7) == "medium"

    def test_low_label(self, monkeypatch):
        monkeypatch.setattr("app.utils.confidence.settings.low_confidence_threshold", 0.6)
        assert confidence_label(0.4) == "low"

    def test_none_returns_unknown(self, monkeypatch):
        monkeypatch.setattr("app.utils.confidence.settings.low_confidence_threshold", 0.6)
        assert confidence_label(None) == "unknown"

    def test_boundary_at_085(self, monkeypatch):
        """Exactly 0.85 is the high/medium boundary."""
        monkeypatch.setattr("app.utils.confidence.settings.low_confidence_threshold", 0.6)
        assert confidence_label(0.85) == "high"

    def test_just_below_085(self, monkeypatch):
        monkeypatch.setattr("app.utils.confidence.settings.low_confidence_threshold", 0.6)
        assert confidence_label(0.849) == "medium"
