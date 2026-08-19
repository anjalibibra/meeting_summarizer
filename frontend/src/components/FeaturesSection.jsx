import React from 'react'
import { Users, FileText, CheckSquare, CheckCircle2, HelpCircle, Lock, Sparkles } from 'lucide-react'

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 paper-texture relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFFFFF] text-[#243447] border-2 border-[#243447] shadow-[2px_2px_0px_0px_#F5C84B] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#5EBEC4]" />
            Core Capabilities
          </div>
          <h2 className="text-4xl sm:text-6xl font-bold text-[#243447] tracking-tight mb-3">
            What you get
          </h2>
          <p className="text-[#5A6E85] text-lg font-medium">
            Everything your meeting leaves behind, organized into a clean, actionable record.
          </p>
        </div>

        {/* Asymmetric Playful Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Speaker-labelled Transcripts (Span 2 cols) */}
          <div className="md:col-span-2 lg:col-span-2 hand-card hand-card-teal p-8 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#5EBEC4] border-2 border-[#243447] flex items-center justify-center text-[#243447] shadow-[3px_3px_0px_0px_#243447]">
                  <Users className="w-6 h-6" />
                </div>
                <span className="font-handwritten text-xs font-bold text-[#243447] bg-[#FDF5DF] px-3 py-1 rounded-md border border-[#243447]">
                  speaker 1 · speaker 2 →
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#243447] mb-2">
                Speaker-labelled transcripts
              </h3>
              <p className="text-[#5A6E85] text-sm leading-relaxed mb-6 font-medium">
                Separates distinct voices using neural diarization. Unclear segments are marked as "uncertain speaker" rather than guessing wrong.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FDF5DF] border-2 border-[#243447] flex items-center justify-between text-xs font-mono font-bold">
              <span className="speaker-chip speaker-0 text-[10px]">Speaker 1</span>
              <span className="speaker-chip speaker-1 text-[9px]">Speaker 2</span>
              <span className="speaker-chip-uncertain text-[9px]">? uncertain</span>
            </div>
          </div>

          {/* Card 2: AI Summaries (Span 2 cols) */}
          <div className="md:col-span-1 lg:col-span-2 hand-card hand-card-pink p-8 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#F92C85] border-2 border-[#243447] flex items-center justify-center text-white shadow-[3px_3px_0px_0px_#243447]">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="font-handwritten text-xs font-bold text-[#243447] bg-[#F5C84B] px-3 py-1 rounded-md border border-[#243447]">
                  3-5 sentences ♡
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#243447] mb-2">
                AI summaries
              </h3>
              <p className="text-[#5A6E85] text-sm leading-relaxed mb-6 font-medium">
                Concise executive overviews focused on outcomes, decisions, and next steps — skipping filler conversation.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FDF5DF] border-2 border-[#243447] text-xs font-medium text-[#243447]">
              "The team agreed to deploy the update by Friday. Alice coordinates release ops..."
            </div>
          </div>

          {/* Card 3: Action Items with Owners */}
          <div className="hand-card p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F92C85] border-2 border-[#243447] flex items-center justify-center text-white shadow-[2.5px_2.5px_0px_0px_#243447] mb-4">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#243447] mb-2">
                Action items with owners
              </h3>
              <p className="text-[#5A6E85] text-xs leading-relaxed mb-4 font-medium">
                Tasks assigned with owners, deadlines, and inferred priorities.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FDF5DF] border border-[#243447]/20 text-[11px] font-bold text-[#243447]">
              → Alice: Deploy API (Fri)
            </div>
          </div>

          {/* Card 4: Key Decisions */}
          <div className="hand-card p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#5EBEC4] border-2 border-[#243447] flex items-center justify-center text-[#243447] shadow-[2.5px_2.5px_0px_0px_#243447] mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#243447] mb-2">
                Key decisions
              </h3>
              <p className="text-[#5A6E85] text-xs leading-relaxed mb-4 font-medium">
                Explicit commitments paired with one-line rationales.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FDF5DF] border border-[#243447]/20 text-[11px] font-bold text-[#5EBEC4]">
              ✓ Friday Release Approved
            </div>
          </div>

          {/* Card 5: Open Questions */}
          <div className="hand-card p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F5C84B] border-2 border-[#243447] flex items-center justify-center text-[#243447] shadow-[2.5px_2.5px_0px_0px_#243447] mb-4">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#243447] mb-2">
                Open questions
              </h3>
              <p className="text-[#5A6E85] text-xs leading-relaxed mb-4 font-medium">
                Unresolved items raised during the meeting saved for follow-up.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FDF5DF] border border-[#243447]/20 text-[11px] font-bold text-[#243447]">
              ? Legal sign-off needed?
            </div>
          </div>

          {/* Card 6: Private & Secure Processing */}
          <div className="hand-card p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#243447] border-2 border-[#243447] flex items-center justify-center text-[#FDF5DF] shadow-[2.5px_2.5px_0px_0px_#5EBEC4] mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#243447] mb-2">
                Private & secure
              </h3>
              <p className="text-[#5A6E85] text-xs leading-relaxed mb-4 font-medium">
                Audio stays on your device. Local Whisper processing ensures data privacy.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FDF5DF] border border-[#243447]/20 text-[11px] font-bold text-[#243447]">
              100% Private local ASR
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
