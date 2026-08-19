import React, { useState } from 'react'
import { Search, Users, AlertTriangle, Mic, Volume2 } from 'lucide-react'

function speakerColorIndex(speaker) {
  if (!speaker || speaker === 'uncertain speaker') return null
  const match = speaker.match(/\d+/)
  if (!match) return 0
  return (parseInt(match[0], 10) - 1) % 4
}

function SpeakerChip({ speaker }) {
  if (!speaker) {
    return (
      <span className="speaker-chip-uncertain" title="Speaker could not be identified">
        ? unknown
      </span>
    )
  }
  if (speaker === 'uncertain speaker') {
    return (
      <span className="speaker-chip-uncertain" title="Diarization confidence was low">
        ? uncertain speaker
      </span>
    )
  }
  const idx = speakerColorIndex(speaker)
  return (
    <span className={`speaker-chip speaker-${idx}`}>
      <Users className="w-3 h-3" />
      {speaker}
    </span>
  )
}

function formatTime(seconds) {
  if (seconds == null) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function TranscriptSegment({ segment }) {
  const confidencePct =
    segment.transcription_confidence != null
      ? `${Math.round(segment.transcription_confidence * 100)}%`
      : null

  const tooltipText =
    segment.is_low_confidence && confidencePct
      ? `Low transcription confidence (${confidencePct}). Highlighted for review.`
      : null

  return (
    <div className="flex gap-4 p-4 rounded-xl bg-[#FDF5DF] border-2 border-[#243447]/20 hover:border-[#243447]/50 transition-colors">
      <span className="text-xs font-mono text-[#5A6E85] font-bold pt-0.5 shrink-0 w-12 flex items-center gap-1">
        <Volume2 className="w-3.5 h-3.5 text-[#5EBEC4]" />
        {formatTime(segment.start_time)}
      </span>

      <div className="flex-1 min-w-0">
        <div className="mb-2">
          <SpeakerChip speaker={segment.speaker} />
        </div>

        <p
          className={`text-sm text-[#243447] leading-relaxed font-medium ${
            segment.is_low_confidence ? 'segment-low-confidence' : ''
          }`}
          title={tooltipText || undefined}
        >
          {segment.text}
        </p>

        {segment.is_low_confidence && (
          <div className="mt-2 flex items-center gap-1 text-[11px] font-mono font-bold text-[#F92C85]">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low confidence score{confidencePct ? ` (${confidencePct})` : ''}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TranscriptViewer({ transcript }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showLowConfOnly, setShowLowConfOnly] = useState(false)

  if (!transcript) {
    return (
      <div className="hand-card p-8 text-center text-[#5A6E85] bg-[#FFFFFF]">
        No transcript data available.
      </div>
    )
  }

  const { segments = [], num_speakers, diarization_available } = transcript

  if (segments.length === 0) {
    return (
      <div className="hand-card p-12 text-center bg-[#FFFFFF]">
        <Mic className="w-12 h-12 text-[#5EBEC4] mx-auto mb-3" />
        <p className="text-[#243447] font-bold text-lg">No speech detected</p>
        <p className="text-[#5A6E85] text-sm mt-1">
          The uploaded audio file did not contain audible speech segments.
        </p>
      </div>
    )
  }

  const filtered = segments.filter((s) => {
    if (showLowConfOnly && !s.is_low_confidence) return false
    if (searchQuery.trim()) {
      return s.text.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const lowConfCount = segments.filter((s) => s.is_low_confidence).length

  return (
    <div className="hand-card p-6 sm:p-8 bg-[#FFFFFF] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#243447]/10 pb-6">
        <div>
          <h3 className="text-xl font-bold text-[#243447] flex items-center gap-2">
            <Mic className="w-5 h-5 text-[#5EBEC4]" />
            Speaker-Labelled Transcript
          </h3>
          <p className="text-xs text-[#5A6E85] font-mono mt-1 font-bold">
            {num_speakers > 0
              ? `${num_speakers} unique speaker${num_speakers !== 1 ? 's' : ''} detected`
              : 'Speaker detection unavailable'}
            {!diarization_available && ' · Heuristic mode active'}
          </p>
        </div>

        {/* Filter toggle */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {lowConfCount > 0 && (
            <button
              onClick={() => setShowLowConfOnly((v) => !v)}
              className={`px-3.5 py-1.5 rounded-full border-2 font-bold transition-all flex items-center gap-1.5 ${
                showLowConfOnly
                  ? 'bg-[#F92C85] text-white border-[#243447]'
                  : 'bg-[#FDF5DF] text-[#243447] border-[#243447]/30 hover:border-[#243447]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{showLowConfOnly ? 'Low-conf Active' : `${lowConfCount} Low-conf Segments`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#5A6E85] absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search transcript text…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl bg-[#FDF5DF] border-2 border-[#243447]/20 pl-10 pr-4 py-2.5 text-xs text-[#243447] font-bold placeholder-[#5A6E85] focus:outline-none focus:border-[#5EBEC4] transition-colors"
        />
      </div>

      {/* Segment List */}
      <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
        {filtered.length === 0 ? (
          <p className="text-xs font-mono text-center py-8 text-[#5A6E85]">
            No transcript segments match your filter query.
          </p>
        ) : (
          filtered.map((seg) => <TranscriptSegment key={seg.id} segment={seg} />)
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs font-mono font-bold text-[#5A6E85] border-t-2 border-[#243447]/10 pt-4">
        <span>Displaying {filtered.length} of {segments.length} segments</span>
        {(searchQuery || showLowConfOnly) && (
          <button
            onClick={() => {
              setSearchQuery('')
              setShowLowConfOnly(false)
            }}
            className="text-[#F92C85] underline"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
