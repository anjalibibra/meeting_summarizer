import React, { useState } from 'react'
import {
  FileText,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Zap,
  Info
} from 'lucide-react'

function findDecisionFlag(flags, decision) {
  if (!flags || !flags.length) return null
  const normalised = decision.trim().toLowerCase()
  return (
    flags.find(
      (f) =>
        f.item_type === 'decision' &&
        f.item_text.trim().toLowerCase() === normalised
    ) || null
  )
}

function FlagBadge({ flag }) {
  const [show, setShow] = useState(false)
  if (!flag || flag.confidence === 'supported') return null

  const isHallucinated = flag.confidence === 'likely_hallucinated'

  return (
    <div className="relative inline-block ml-2">
      <span
        className={`flag-badge ${isHallucinated ? 'flag-hallucinated' : 'flag-uncertain'}`}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        role="status"
      >
        {isHallucinated ? (
          <>
            <Zap className="w-3 h-3" /> ⚡ Unverified
          </>
        ) : (
          <>
            <AlertTriangle className="w-3 h-3" /> ⚠ Needs Review
          </>
        )}
      </span>
      {show && (
        <div className="absolute right-0 top-7 z-20 rounded-xl p-3 text-xs w-64 shadow-2xl bg-[#FFFFFF] border-2 border-[#243447] text-[#243447] leading-relaxed font-sans font-medium">
          <p className="font-bold text-[#243447] mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide">
            <Info className="w-3 h-3 text-[#F5C84B]" />
            Verification Finding
          </p>
          <p className="text-[#5A6E85] text-[11px]">{flag.flag_reason}</p>
        </div>
      )}
    </div>
  )
}

export default function SummaryCard({ summary }) {
  if (!summary) {
    return (
      <div className="hand-card p-8 text-center text-[#5A6E85] bg-[#FFFFFF]">
        No summary intelligence available.
      </div>
    )
  }

  const {
    executive_summary,
    key_decisions = [],
    open_questions = [],
    verification_flags = [],
  } = summary

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {executive_summary && (
        <div className="hand-card p-6 sm:p-8 bg-[#FFFFFF] space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-[#243447]/10 pb-4">
            <div className="w-8 h-8 rounded-lg bg-[#5EBEC4] border-2 border-[#243447] flex items-center justify-center text-[#243447]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#243447] uppercase tracking-wider font-mono">
                Executive Overview
              </h3>
              <p className="text-[11px] text-[#5A6E85] font-mono font-bold">Synthesized outcomes</p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-[#243447] leading-relaxed font-sans font-medium">
            {executive_summary}
          </p>
        </div>
      )}

      {/* Key Decisions */}
      <div className="hand-card p-6 sm:p-8 bg-[#FFFFFF] space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-[#243447]/10 pb-4">
          <div className="w-8 h-8 rounded-lg bg-[#F5C84B] border-2 border-[#243447] flex items-center justify-center text-[#243447]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#243447] uppercase tracking-wider font-mono">
              Key Decisions & Rationales
            </h3>
            <p className="text-[11px] text-[#5A6E85] font-mono font-bold">Explicit commitments agreed</p>
          </div>
        </div>

        {key_decisions.length === 0 ? (
          <p className="text-xs font-mono italic text-[#5A6E85]">
            No explicit key decisions recorded during this meeting.
          </p>
        ) : (
          <div className="space-y-3">
            {key_decisions.map((d, i) => {
              const flag = findDecisionFlag(verification_flags, d.decision)

              return (
                <div
                  key={i}
                  className="rounded-2xl p-4 sm:p-5 bg-[#FDF5DF] border-2 border-[#243447] shadow-[3px_3px_0px_0px_#5EBEC4]"
                  style={{
                    borderLeftWidth: '5px',
                    borderLeftColor:
                      flag?.confidence === 'likely_hallucinated'
                        ? '#F92C85'
                        : flag?.confidence === 'uncertain'
                        ? '#F5C84B'
                        : '#5EBEC4',
                  }}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <p className="font-bold text-sm sm:text-base text-[#243447]">
                      {d.decision}
                    </p>
                    <FlagBadge flag={flag} />
                  </div>
                  {d.rationale && (
                    <p className="text-xs font-sans text-[#5A6E85] mt-2 italic font-medium">
                      Rationale: {d.rationale}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Open Questions */}
      <div className="hand-card p-6 sm:p-8 bg-[#FFFFFF] space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-[#243447]/10 pb-4">
          <div className="w-8 h-8 rounded-lg bg-[#F92C85] border-2 border-[#243447] flex items-center justify-center text-white">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#243447] uppercase tracking-wider font-mono">
              Open Questions & Unresolved Items
            </h3>
            <p className="text-[11px] text-[#5A6E85] font-mono font-bold">Unresolved questions raised</p>
          </div>
        </div>

        {open_questions.length === 0 ? (
          <p className="text-xs font-mono italic text-[#5A6E85]">
            No unresolved open questions were identified.
          </p>
        ) : (
          <ul className="space-y-3">
            {open_questions.map((q, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FDF5DF] border-2 border-[#243447]/20 text-xs sm:text-sm text-[#243447] font-medium"
              >
                <span className="font-mono text-[#F92C85] font-bold shrink-0">{i + 1}.</span>
                <span className="leading-relaxed">{q}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
