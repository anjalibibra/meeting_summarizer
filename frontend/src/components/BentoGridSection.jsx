import React from 'react'
import {
  Users,
  FileText,
  CheckSquare,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Zap,
  Activity,
  ArrowUpRight
} from 'lucide-react'

export default function BentoGridSection() {
  return (
    <section id="features" className="py-24 relative overflow-hidden bg-[#07090e]">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[350px] bg-cyan-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-violet-500/10 text-violet-300 border border-violet-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Complete Feature Matrix
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Everything your meeting leaves behind.
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Comprehensive, decision-grade intelligence extracted automatically from every voice recording.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Speaker-labelled Transcript (Span 2 cols) */}
          <div className="md:col-span-2 lg:col-span-2 rounded-3xl bg-[#0d111d]/80 backdrop-blur-xl border border-slate-800/80 hover:border-violet-500/40 p-8 transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                  Neural Diarization
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                Speaker-Labelled Transcript
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Automatically isolates distinct voices into Speaker 1, Speaker 2, etc. Low-confidence turns are marked as "uncertain speaker" rather than guessing wrong.
              </p>
            </div>

            {/* Micro visual: Diarized transcript preview */}
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="speaker-chip speaker-0 text-[10px]">Speaker 1</span>
                <span className="text-[10px] font-mono text-slate-500">00:02:15</span>
              </div>
              <p className="text-xs text-slate-300">
                "We'll finalize the roadmap by Wednesday morning."
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="speaker-chip-uncertain text-[10px]">? uncertain speaker</span>
                <span className="text-[10px] font-mono text-amber-400">Confidence: 68%</span>
              </div>
            </div>
          </div>

          {/* Card 2: AI Executive Summary (Span 2 cols) */}
          <div className="md:col-span-1 lg:col-span-2 rounded-3xl bg-[#0d111d]/80 backdrop-blur-xl border border-slate-800/80 hover:border-violet-500/40 p-8 transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  JSON Schema
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
                AI Executive Summary
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Distills 60+ minutes of conversation into a 3-5 sentence executive overview focused on outcomes, technical tradeoffs, and immediate next steps.
              </p>
            </div>

            {/* Micro visual: Summary Preview */}
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-violet-300 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Executive Overview</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "The engineering team approved the Q3 backend refactor to resolve database connection pooling limits. Production release scheduled for Friday..."
              </p>
            </div>
          </div>

          {/* Card 3: Action Items Checklist (Span 1 col) */}
          <div className="rounded-3xl bg-[#0d111d]/80 backdrop-blur-xl border border-slate-800/80 hover:border-violet-500/40 p-6 transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Action Items
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Extracts tasks, assigned owner, deadline, and infers priority from meeting context.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-200">
                <span className="font-medium">→ Alice: Deploy API</span>
                <span className="text-[10px] text-red-400 font-bold">HIGH</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Deadline: Fri</span>
                <span>Owner: Alice</span>
              </div>
            </div>
          </div>

          {/* Card 4: Key Decisions (Span 1 col) */}
          <div className="rounded-3xl bg-[#0d111d]/80 backdrop-blur-xl border border-slate-800/80 hover:border-violet-500/40 p-6 transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Key Decisions
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Explicit commitments paired with one-line rationales agreed during discussion.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 text-xs">
              <p className="text-emerald-300 font-medium mb-0.5">✓ Skip Staging Env</p>
              <p className="text-slate-400 text-[10px] italic">Rationale: Timeline pressure</p>
            </div>
          </div>

          {/* Card 5: Open Questions (Span 1 col) */}
          <div className="rounded-3xl bg-[#0d111d]/80 backdrop-blur-xl border border-slate-800/80 hover:border-violet-500/40 p-6 transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                Open Questions
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Tracks unresolved questions raised but left unanswered during the session.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 text-xs">
              <p className="text-amber-300 font-medium">? Legal sign-off required?</p>
              <p className="text-slate-500 text-[10px]">Unresolved item</p>
            </div>
          </div>

          {/* Card 6: AI Self-Verification Pass (Span 1 col) */}
          <div className="rounded-3xl bg-[#0d111d]/80 backdrop-blur-xl border border-slate-800/80 hover:border-violet-500/40 p-6 transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                Self-Verification
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Second-pass LLM fact checker flags any unconfirmed or hallucinated claims.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 text-xs flex items-center justify-between">
              <span className="flag-badge flag-supported">✓ Verified</span>
              <span className="flag-badge flag-uncertain">⚡ Review</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
