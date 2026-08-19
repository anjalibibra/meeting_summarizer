"""
Tests for LLM summary parsing logic.

These tests verify that:
  1. Valid JSON from the LLM is parsed into the correct schema
  2. Malformed JSON (markdown fences, extra prose) is handled gracefully
  3. Missing keys are filled with safe defaults
  4. The stub provider returns parseable, correctly structured output

No real LLM calls are made — all tests use the stub provider or
feed raw JSON strings directly to the parsing utilities.
"""

from __future__ import annotations

import json
import pytest

from app.services.llm import (
    LLMError,
    _coerce_list,
    _extract_json,
    _stub_summarize_response,
    _stub_verify_response,
    summarize_transcript,
    verify_summary,
)


# ── JSON extraction tests ──────────────────────────────────────────────────────

class TestExtractJson:
    """Tests for _extract_json() — the LLM response parsing helper."""

    def test_plain_json_object(self):
        raw = '{"key": "value", "num": 42}'
        result = _extract_json(raw)
        assert result == {"key": "value", "num": 42}

    def test_json_array(self):
        raw = '[{"a": 1}, {"b": 2}]'
        result = _extract_json(raw)
        assert len(result) == 2

    def test_strips_markdown_fences(self):
        """LLMs often add ```json fences despite instructions not to."""
        raw = "```json\n{\"key\": \"value\"}\n```"
        result = _extract_json(raw)
        assert result == {"key": "value"}

    def test_strips_plain_fences(self):
        raw = "```\n{\"key\": \"value\"}\n```"
        result = _extract_json(raw)
        assert result == {"key": "value"}

    def test_json_embedded_in_prose(self):
        """Handles cases where the LLM adds preamble text."""
        raw = 'Here is the summary:\n{"executive_summary": "test"}'
        result = _extract_json(raw)
        assert result["executive_summary"] == "test"

    def test_raises_on_unparseable(self):
        with pytest.raises(ValueError, match="Could not extract valid JSON"):
            _extract_json("This is just prose with no JSON at all.")

    def test_raises_on_broken_json(self):
        with pytest.raises(ValueError):
            _extract_json("{broken json: yes}")


# ── Coerce list tests ─────────────────────────────────────────────────────────

class TestCoerceList:
    def test_list_passthrough(self):
        assert _coerce_list([1, 2, 3]) == [1, 2, 3]

    def test_none_becomes_empty_list(self):
        assert _coerce_list(None) == []

    def test_scalar_wrapped(self):
        assert _coerce_list("item") == ["item"]

    def test_empty_list(self):
        assert _coerce_list([]) == []


# ── Stub summarize response tests ─────────────────────────────────────────────

class TestStubSummarizeResponse:
    """Verify the stub response is valid and correctly structured."""

    def test_is_valid_json(self):
        raw = _stub_summarize_response()
        data = json.loads(raw)
        assert isinstance(data, dict)

    def test_has_required_keys(self):
        data = json.loads(_stub_summarize_response())
        assert "executive_summary" in data
        assert "key_decisions" in data
        assert "action_items" in data
        assert "open_questions" in data

    def test_action_items_have_required_fields(self):
        data = json.loads(_stub_summarize_response())
        for item in data["action_items"]:
            assert "task" in item
            assert "owner" in item
            assert "deadline" in item
            assert "priority" in item

    def test_action_item_priority_valid(self):
        data = json.loads(_stub_summarize_response())
        valid_priorities = {"high", "medium", "low"}
        for item in data["action_items"]:
            assert item["priority"] in valid_priorities, (
                f"Invalid priority '{item['priority']}' in action item"
            )

    def test_key_decisions_have_required_fields(self):
        data = json.loads(_stub_summarize_response())
        for d in data["key_decisions"]:
            assert "decision" in d
            # rationale is optional — may be present or None


# ── Stub verify response tests ────────────────────────────────────────────────

class TestStubVerifyResponse:
    def test_is_valid_json_array(self):
        raw = _stub_verify_response()
        data = json.loads(raw)
        assert isinstance(data, list)

    def test_flags_have_required_fields(self):
        data = json.loads(_stub_verify_response())
        for flag in data:
            assert "item_type" in flag
            assert "item_text" in flag
            assert "flag_reason" in flag
            assert "confidence" in flag

    def test_confidence_values_valid(self):
        valid_confidence = {"supported", "uncertain", "likely_hallucinated"}
        data = json.loads(_stub_verify_response())
        for flag in data:
            assert flag["confidence"] in valid_confidence, (
                f"Invalid confidence value: {flag['confidence']}"
            )


# ── Integration-style tests with stub provider ────────────────────────────────

class TestSummarizeWithStub:
    """End-to-end tests of summarize_transcript() using the stub LLM."""

    def test_returns_expected_structure(self, monkeypatch):
        monkeypatch.setattr("app.services.llm.settings.llm_provider", "stub")
        result = summarize_transcript("Speaker 1: test transcript.", 30.0)

        assert "executive_summary" in result
        assert isinstance(result["action_items"], list)
        assert isinstance(result["key_decisions"], list)
        assert isinstance(result["open_questions"], list)
        assert "raw_llm_response" in result

    def test_action_items_not_empty(self, monkeypatch):
        monkeypatch.setattr("app.services.llm.settings.llm_provider", "stub")
        result = summarize_transcript("Speaker 1: Alice will deploy Friday.", 10.0)
        assert len(result["action_items"]) > 0

    def test_verify_returns_flags(self, monkeypatch):
        monkeypatch.setattr("app.services.llm.settings.llm_provider", "stub")
        summary = {
            "action_items": [{"task": "Handle deployment", "owner": "Alice",
                               "deadline": "Friday", "priority": "high"}],
            "key_decisions": [{"decision": "Launch next Friday", "rationale": None}],
        }
        result = verify_summary("Speaker 1: test", summary)
        assert "verification_flags" in result
        assert isinstance(result["verification_flags"], list)


# ── Missing-key handling tests ────────────────────────────────────────────────

class TestMissingKeyHandling:
    """Verify that partial LLM output is handled safely."""

    def test_missing_action_items_defaults_to_empty(self, monkeypatch):
        """If the LLM omits action_items, we get [] not a KeyError."""
        partial_json = json.dumps({
            "executive_summary": "A meeting happened.",
            "key_decisions": [],
            "open_questions": [],
            # action_items intentionally missing
        })
        monkeypatch.setattr(
            "app.services.llm._call_llm",
            lambda sys, usr: partial_json
        )
        monkeypatch.setattr("app.services.llm.settings.llm_provider", "openai")

        result = summarize_transcript("test", 10.0)
        assert result["action_items"] == []

    def test_missing_open_questions_defaults_to_empty(self, monkeypatch):
        partial_json = json.dumps({
            "executive_summary": "A meeting happened.",
            "key_decisions": [],
            "action_items": [],
            # open_questions intentionally missing
        })
        monkeypatch.setattr(
            "app.services.llm._call_llm",
            lambda sys, usr: partial_json
        )
        monkeypatch.setattr("app.services.llm.settings.llm_provider", "openai")

        result = summarize_transcript("test", 10.0)
        assert result["open_questions"] == []
