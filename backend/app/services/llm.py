"""
LLM service: structured summarization + verification pass.

Two responsibilities kept in one file because they share the same client,
prompt-loading logic, and JSON-parsing error handling.  If either pass
grows significantly more complex, split into summarize.py and verify.py.

Why we load prompts from .md files at call time rather than module load:
  - Prompts can be edited by non-engineers without restarting the server
    (useful during iteration/tuning).
  - File-based prompts show up clearly in git diffs — no noisy Python string
    changes mixed in with logic changes.
  - The overhead of one file read per API call is negligible compared to
    LLM network latency.
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

# Path to prompt templates relative to this file's parent's parent
_PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"


# ── Prompt loading ────────────────────────────────────────────────────────────

def _load_prompt_template(filename: str) -> tuple[str, str]:
    """
    Parse a prompt .md file and extract the system instruction and user
    prompt template.

    The .md files use the following structure:
        ## System Instruction
        <system text>
        ## User Prompt Template
        ```
        <user prompt>
        ```

    Returns (system_instruction, user_prompt_template).
    """
    path = _PROMPTS_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Prompt template not found: {path}")

    content = path.read_text(encoding="utf-8")

    # Extract system instruction block
    system_match = re.search(
        r"## System Instruction\s*\n(.*?)(?=\n##|\Z)", content, re.DOTALL
    )
    system_text = system_match.group(1).strip() if system_match else ""

    # Extract user prompt (inside a fenced code block after "## User Prompt Template")
    user_match = re.search(
        r"## User Prompt Template\s*\n```[^\n]*\n(.*?)```", content, re.DOTALL
    )
    user_text = user_match.group(1).strip() if user_match else ""

    return system_text, user_text


# ── JSON extraction ───────────────────────────────────────────────────────────

def _extract_json(text: str) -> Any:
    """
    Extract a JSON object or array from LLM response text.

    LLMs sometimes wrap JSON in markdown fences despite explicit instructions
    not to.  This function strips common wrapping and falls back to a regex
    search for the outermost JSON structure.
    """
    # Strip markdown code fences
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text.strip(), flags=re.MULTILINE)
    text = text.strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Fallback: find the outermost { } or [ ] block
    for pattern in (r"\{.*\}", r"\[.*\]"):
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                continue

    raise ValueError(f"Could not extract valid JSON from LLM response: {text[:300]!r}")


# ── LLM client factory ────────────────────────────────────────────────────────

def _get_openai_client():
    """Return an OpenAI-compatible client based on the configured provider."""
    from openai import OpenAI

    # The OpenAI client works with any OpenAI-compatible API by setting base_url.
    # For Anthropic, users would need a different client, but the interface
    # here is the same — making swapping straightforward.
    client = OpenAI(api_key=settings.llm_api_key)
    return client


def _call_llm(system_prompt: str, user_prompt: str) -> str:
    """
    Make a single LLM API call and return the response text.

    Separated from parsing so that errors in JSON extraction don't obscure
    API errors, and so we can log both separately.
    """
    if settings.llm_provider == "stub":
        # Return a valid stub response for tests without making API calls
        return _stub_summarize_response()

    client = _get_openai_client()
    response = client.chat.completions.create(
        model=settings.llm_model,
        temperature=settings.llm_temperature,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return response.choices[0].message.content or ""


def _call_llm_verify(system_prompt: str, user_prompt: str) -> str:
    """Separate call for verification so we can tune the model independently."""
    if settings.llm_provider == "stub":
        return _stub_verify_response()

    client = _get_openai_client()
    response = client.chat.completions.create(
        model=settings.llm_model,
        temperature=0.1,  # Even lower temperature for fact-checking pass
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return response.choices[0].message.content or ""


# ── Summarization ─────────────────────────────────────────────────────────────

def summarize_transcript(transcript_text: str, duration_seconds: float) -> dict[str, Any]:
    """
    Run the summarization LLM pass and return parsed structured output.

    Parameters
    ----------
    transcript_text:
        Full transcript with speaker labels, e.g.:
        "Speaker 1: We need to launch by Friday.\nSpeaker 2: Agreed."
    duration_seconds:
        Approximate meeting duration for context in the prompt.

    Returns
    -------
    dict with keys: executive_summary, key_decisions, action_items, open_questions
    Also includes raw_llm_response for storage/debugging.

    Raises
    ------
    LLMError on API failure or unparseable response.
    """
    system_prompt, user_template = _load_prompt_template("summarize.md")

    duration_minutes = max(1, round(duration_seconds / 60))
    user_prompt = user_template.replace("{{TRANSCRIPT}}", transcript_text).replace(
        "{{MEETING_DURATION}}", str(duration_minutes)
    )

    logger.info("Calling LLM for summarization (model=%s)…", settings.llm_model)
    try:
        raw_response = _call_llm(system_prompt, user_prompt)
    except Exception as e:
        raise LLMError(f"LLM API call failed during summarization: {e}") from e

    logger.debug("Raw summarization response: %s", raw_response[:500])

    try:
        parsed = _extract_json(raw_response)
    except ValueError as e:
        raise LLMError(f"Failed to parse LLM summarization output as JSON: {e}") from e

    # Normalise: ensure all expected keys exist with safe defaults
    result = {
        "executive_summary": parsed.get("executive_summary", ""),
        "key_decisions": _coerce_list(parsed.get("key_decisions", [])),
        "action_items": _coerce_list(parsed.get("action_items", [])),
        "open_questions": _coerce_list(parsed.get("open_questions", [])),
        "raw_llm_response": raw_response,
    }

    return result


# ── Verification pass ─────────────────────────────────────────────────────────

def verify_summary(transcript_text: str, summary_data: dict[str, Any]) -> dict[str, Any]:
    """
    Run the second-pass LLM verification check.

    Checks each action item and decision against the original transcript
    and returns a list of confidence flags.

    Returns
    -------
    dict with keys: verification_flags (list), raw_verification_response (str)
    """
    system_prompt, user_template = _load_prompt_template("verify.md")

    summary_json = json.dumps(
        {
            "action_items": summary_data.get("action_items", []),
            "key_decisions": summary_data.get("key_decisions", []),
        },
        indent=2,
    )

    user_prompt = user_template.replace("{{TRANSCRIPT}}", transcript_text).replace(
        "{{SUMMARY_JSON}}", summary_json
    )

    logger.info("Calling LLM for verification pass…")
    try:
        raw_response = _call_llm_verify(system_prompt, user_prompt)
    except Exception as e:
        logger.warning("Verification LLM call failed: %s. Continuing without flags.", e)
        return {"verification_flags": [], "raw_verification_response": str(e)}

    try:
        flags = _extract_json(raw_response)
        if not isinstance(flags, list):
            flags = []
    except ValueError:
        logger.warning("Could not parse verification response as JSON. No flags will be set.")
        flags = []

    # Sanitise each flag object
    clean_flags = []
    for f in flags:
        if not isinstance(f, dict):
            continue
        clean_flags.append(
            {
                "item_type": str(f.get("item_type", "other")),
                "item_text": str(f.get("item_text", "")),
                "flag_reason": str(f.get("flag_reason", "")),
                "confidence": str(f.get("confidence", "uncertain")),
            }
        )

    return {
        "verification_flags": clean_flags,
        "raw_verification_response": raw_response,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _coerce_list(value: Any) -> list:
    """Ensure a value is a list; wrap scalars, return [] for None."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


# ── Stub responses for tests ──────────────────────────────────────────────────

def _stub_summarize_response() -> str:
    return json.dumps(
        {
            "executive_summary": (
                "The team (Anjali, Manveet, and Ranjana) finalized the product roadmap for Q3. "
                "Manveet will manage backend API deployment and database connection pooling. "
                "Ranjana will complete the integration test suite and design review before Wednesday."
            ),
            "key_decisions": [
                {
                    "decision": "Finalize Q3 product roadmap and release schedule",
                    "rationale": "Aligning engineering priorities across team members",
                }
            ],
            "action_items": [
                {
                    "task": "Handle backend API deployment & database pooling",
                    "owner": "Manveet",
                    "deadline": "Q3 release",
                    "priority": "high",
                },
                {
                    "task": "Complete integration test suite & design review",
                    "owner": "Ranjana",
                    "deadline": "Wednesday",
                    "priority": "high",
                },
                {
                    "task": "Finalize product roadmap sync",
                    "owner": "Anjali",
                    "deadline": "Q3 schedule",
                    "priority": "medium",
                },
            ],
            "open_questions": [],
        }
    )


def _stub_verify_response() -> str:
    return json.dumps(
        [
            {
                "item_type": "action_item",
                "item_text": "Handle backend API deployment & database pooling",
                "flag_reason": "Clearly mentioned in transcript: 'I will handle the backend API deployment'",
                "confidence": "supported",
            },
            {
                "item_type": "action_item",
                "item_text": "Complete integration test suite & design review",
                "flag_reason": "Clearly mentioned in transcript: 'I'll complete the integration test suite'",
                "confidence": "supported",
            },
            {
                "item_type": "decision",
                "item_text": "Finalize Q3 product roadmap and release schedule",
                "flag_reason": "Directly stated: 'Let's finalize the product roadmap and release schedule for Q3'",
                "confidence": "supported",
            },
        ]
    )


class LLMError(Exception):
    """Raised when the LLM API call or response parsing fails unrecoverably."""
    pass
