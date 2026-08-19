# Meeting Summarizer

Transcribes meeting audio and generates structured, action-oriented summaries — not just a paragraph. Produces a verified JSON output with action items, decisions, open questions, and an executive summary. Speaker diarization labels who said what.

---

## Table of Contents

1. [Demo](#demo)
2. [What It Does](#what-it-does)
3. [How to Run Locally](#how-to-run-locally)
4. [Architecture](#architecture)
5. [Design Decisions & Tradeoffs](#design-decisions--tradeoffs)
6. [Structured Output Schema & Example](#structured-output-schema--example)

---

## Demo

https://github.com/anjalibibra/meeting_summarizer/raw/main/Demo_video.mp4

---

## What It Does

1. **Upload** an audio file (MP3, WAV, M4A, OGG, FLAC, WebM)
2. **Transcribe** it locally with OpenAI Whisper (no data sent to a cloud ASR API)
3. **Diarize** speakers — labels each segment with "Speaker 1", "Speaker 2", etc. Low-confidence segments are marked "uncertain speaker" rather than silently guessing wrong
4. **Summarize** with an LLM — outputs structured JSON, not free prose
5. **Verify** — a second LLM pass checks every action item and decision against the original transcript and flags anything that cannot be confirmed
6. **Display** results in a tabbed UI: transcript with per-segment confidence highlighting, action items as a checklist, decisions and open questions grouped separately

---

## How to Run Locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- [ffmpeg](https://ffmpeg.org/download.html) installed and on PATH (required by pydub for MP3/M4A decoding)
- An OpenAI API key (or set `LLM_PROVIDER=stub` in `.env` for development without API calls)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set LLM_API_KEY at minimum

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: http://localhost:5173

### Running Tests

```bash
cd backend
pytest tests/ -v
```

Tests use synthetic audio (generated via stdlib `wave`) and stub LLM/ASR providers — no real recordings, no API calls, no GPU required.

### Optional: Production Speaker Diarization

For high-quality speaker diarization (pyannote.audio):

```bash
pip install pyannote.audio
```

Then:
1. Accept the model license at https://huggingface.co/pyannote/speaker-diarization-3.1
2. Set `HUGGINGFACE_TOKEN=hf_yourtoken` in `.env`

Without this, the app falls back to heuristic diarization (silence-gap based). It works, but is less accurate for overlapping or rapidly alternating speakers.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AUDIO INPUT                                  │
│           (MP3, WAV, M4A, OGG, FLAC, WebM — up to 500 MB)          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  HTTP multipart upload
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FastAPI UPLOAD ROUTER                             │
│  • Validates extension, file size, magic bytes                      │
│  • Streams file to disk (UUID filename, no path traversal risk)     │
│  • Creates ProcessingJob in SQLite                                  │
│  • Returns job_id immediately (HTTP 202)                            │
│  • Launches pipeline as BackgroundTask                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  background thread
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CHUNKER (if > 10 min)                          │
│  • Splits audio into overlapping chunks (10 min + 30 s overlap)     │
│  • Yields (chunk_path, offset_seconds) pairs                        │
│  • Deduplicates segments from overlap regions after merge           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ASR: LOCAL WHISPER                                │
│  • Runs per-chunk (avoids Whisper's practical ~30 min limit)        │
│  • word_timestamps=True → per-word probability scores               │
│  • Segments below LOW_CONFIDENCE_THRESHOLD flagged (not hidden)     │
│  • Timestamps shifted by chunk offset to absolute positions         │
│  • Providers: whisper | faster_whisper | stub (swappable interface) │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  all segments merged
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 DIARIZATION: RUNS ON FULL FILE                       │
│  • pyannote.audio (if token set) or heuristic silence-gap fallback  │
│  • ALWAYS on full file, NOT per-chunk → consistent speaker IDs      │
│  • Maps SPEAKER_00 → "Speaker 1", SPEAKER_01 → "Speaker 2", etc.   │
│  • Below DIARIZATION_CONFIDENCE_THRESHOLD → "uncertain speaker"     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  labelled segments
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 LLM SUMMARIZATION PASS                               │
│  • Prompt loaded from prompts/summarize.md (editable, versioned)    │
│  • Returns structured JSON: executive_summary, key_decisions,       │
│    action_items (task/owner/deadline/priority), open_questions       │
│  • Temperature 0.2 → deterministic extraction, not creative prose   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  summary JSON
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 LLM VERIFICATION PASS                                │
│  • Separate LLM call — different instruction frame ("fact-checker") │
│  • Checks each action item and decision against original transcript  │
│  • Returns confidence: supported | uncertain | likely_hallucinated  │
│  • Prompt loaded from prompts/verify.md                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  results + flags
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SQLite DATABASE                                │
│  • ProcessingJob  — status, progress, file metadata                 │
│  • Transcript     — full text, speaker count, diarization status    │
│  • TranscriptSegment — per-segment: text, speaker, confidence flags │
│  • MeetingSummary — all structured fields + verification flags      │
│  • Schema: SQLAlchemy ORM → swap URL for Postgres, zero code change │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  REST API (FastAPI)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                                   │
│                                                                     │
│  UploadPage                                                         │
│    • Drag-and-drop + file picker                                    │
│    • Real byte-level upload progress bar (axios onUploadProgress)   │
│                                                                     │
│  StatusPage                                                         │
│    • Polls /jobs/{id} every 2 s                                     │
│    • Shows stage name + progress % + human-readable message         │
│    • Pipeline stage timeline (Transcribing → Diarizing → etc.)      │
│                                                                     │
│  ResultsPage                                                        │
│    • Tab 1 — Summary: executive summary, decisions (+flags), Qs     │
│    • Tab 2 — Actions: checklist with owner/deadline/priority        │
│               Verification badges: ✓ Verified | ⚠ Review | ⚡ Risk  │
│    • Tab 3 — Transcript: per-segment with amber underline for       │
│               low-confidence, grey italic chip for uncertain speaker │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Design Decisions & Tradeoffs

### 1. Local Whisper over a paid cloud ASR API

**Chosen:** `openai-whisper` (or `faster-whisper`) running locally.

**Why:**
- **Cost**: No per-minute billing. A 1-hour meeting costs ~$0 in ASR after setup.
- **Privacy**: Audio never leaves the machine. Confidential board meetings, legal discussions, and HR recordings cannot be sent to a third-party API by policy in many organisations.
- **Offline use**: Works without internet access once the model is downloaded.

**Tradeoff:**
- Slower than cloud APIs, especially without a GPU. A 1-hour meeting takes ~10 min on CPU with the `base` model.
- Accuracy slightly below the best cloud APIs for accented speech.
- The ASR interface (`BaseASRProvider`) was designed from day one to be swappable — adding Azure Cognitive Services or Google STT requires implementing `transcribe()` and setting `ASR_PROVIDER=azure` in `.env`.

---

### 2. Second LLM verification pass

**Why it exists:**
LLMs hallucinate. In meeting notes, a hallucinated action item ("Bob will call the client by Monday") that was never discussed can cause real-world harm — deadlines missed, people confused about commitments they never made.

**Why a separate call instead of self-checking:**
Asking the same LLM to verify its own output in one prompt leads it to rationalize its choices rather than critically examine them. A separate call with a different system prompt ("You are a fact-checker") and lower temperature (0.1 vs. 0.2) produces more independent verification.

**Tradeoff:**
- Doubles LLM API cost per meeting.
- Adds 5–15 s of latency to the pipeline.
- Mitigation: the verification pass uses the same (cheap) model by default. A production deployment could use a smaller model (e.g., `gpt-4o-mini`) for verification even if summarization uses a larger one.

---

### 3. Structured JSON output instead of free prose

**Why:**
Free-text summaries are readable but not actionable. A paragraph doesn't tell you who is responsible for what, or which items are unresolved questions vs. committed decisions. Structured JSON enables:
- Rendering action items as a checklist with status tracking
- Sorting/filtering by priority or owner
- Feeding into downstream tools (Jira, Linear, Notion) via their APIs
- Machine-readable verification by the second LLM pass

**Tradeoff:**
- JSON parsing can fail if the LLM ignores the instruction. Mitigated by `_extract_json()` which handles markdown-fenced responses and regex-extracts the outermost JSON block as a fallback.

---

### 4. SQLite with swap-to-Postgres path

**Why SQLite:**
Zero configuration, no server process, built into Python. Appropriate for single-user or small-team local deployment.

**How to swap:**
Change one env var: `DATABASE_URL=postgresql://user:pass@host/db`. SQLAlchemy's dialect abstraction means no code changes. WAL mode is enabled for SQLite so concurrent reads (frontend polling) don't block writes (pipeline saving).

**What's missing for production Postgres:**
- Alembic migrations (currently `create_all` on startup — works for SQLite, brittle for production)
- Connection pooling configuration

---

### 5. Heuristic diarization fallback

**Why:**
pyannote.audio requires a HuggingFace token and license acceptance — not something that works out of the box for all users. The heuristic (new speaker = silence gap > 1.5 s) is crude but ensures the app works without any additional setup.

**Limitation:**
Heuristic diarization assigns a new speaker every time there's a pause. In practice this means a single speaker pausing for thought may be labelled as two different speakers. pyannote is strongly recommended for any real use.

---

## Structured Output Schema & Example

### Schema

```json
{
  "executive_summary": "string (3–5 sentences)",

  "key_decisions": [
    {
      "decision": "string — declarative statement of the decision",
      "rationale": "string or null — one-line reason, if stated"
    }
  ],

  "action_items": [
    {
      "task":     "string — concrete, actionable task description",
      "owner":    "string — name/role, or 'unassigned'",
      "deadline": "string — when due, or 'not specified'",
      "priority": "'high' | 'medium' | 'low'"
    }
  ],

  "open_questions": [
    "string — unresolved question raised but not answered"
  ]
}
```

Priority inference rules:
- `high`: urgent language ("ASAP", "critical", "immediately"), near-term deadline, explicitly blocking others
- `low`: nice-to-have, long-horizon, explicitly deprioritized
- `medium`: everything else

### Example Output

Given the transcript:
> **Speaker 1:** We need to launch the new dashboard feature by next Friday — it's blocking the sales team.
> **Speaker 2:** Agreed. I'll handle the deployment. Can you write the tests, Bob?
> **Speaker 3:** Sure, I'll have them done by Wednesday.
> **Speaker 1:** We decided to skip the staging environment this time to save time. One thing I'm not sure about — do we need legal sign-off on the new data fields?

The structured output would be:

```json
{
  "executive_summary": "The team agreed to launch the new dashboard feature by next Friday to unblock the sales team. Speaker 2 will handle deployment and Speaker 3 (Bob) will complete tests by Wednesday. The team decided to skip the staging environment for this release. A legal question about new data fields was raised but remains unresolved.",

  "key_decisions": [
    {
      "decision": "Launch the new dashboard feature by next Friday",
      "rationale": "Blocking the sales team"
    },
    {
      "decision": "Skip the staging environment for this release",
      "rationale": "To save time"
    }
  ],

  "action_items": [
    {
      "task": "Handle deployment",
      "owner": "Speaker 2",
      "deadline": "next Friday",
      "priority": "high"
    },
    {
      "task": "Write tests for the dashboard feature",
      "owner": "Bob",
      "deadline": "Wednesday",
      "priority": "high"
    }
  ],

  "open_questions": [
    "Does the new data fields feature require legal sign-off?"
  ]
}
```

