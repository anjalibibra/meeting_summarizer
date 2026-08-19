import React, { useState, useEffect } from 'react'
import { Sparkles, ArrowRight, CheckCircle2, Mic, HelpCircle, CheckSquare, FileText } from 'lucide-react'

export default function AiTransformationSection() {
  const [phase, setPhase] = useState(0) // 0: Raw lines -> 1: Understanding -> 2: Notes

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev + 1) % 3)
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-20 bg-[#FDF5DF] border-y-2 border-[#243447]/10 relative overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFFFFF] text-[#243447] border-2 border-[#243447] shadow-[2px_2px_0px_0px_#F92C85] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#F92C85]" />
            Live Intelligence Engine
          </div>
          <h2 className="text-4xl sm:text-6xl font-bold text-[#243447] tracking-tight mb-3">
            From conversation to clarity.
          </h2>
          <p className="text-[#5A6E85] text-lg font-medium">
            Watch raw meeting audio transform into structured, actionable output.
          </p>
        </div>

        {/* 3-Stage Transformation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* LEFT: Raw Recording & Speaker Transcript */}
          <div className="lg:col-span-4 hand-card p-6 bg-[#FFFFFF]">
            <div className="flex items-center justify-between border-b-2 border-[#243447]/10 pb-3 mb-4">
              <span className="font-mono text-xs font-bold text-[#243447] uppercase tracking-wider">
                RAW RECORDING
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#5EBEC4] text-[#243447]">
                SPEAKER AUDIO
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FDF5DF] border border-[#243447]/20 space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-[#5A6E85] font-bold">
                  <span className="text-[#F92C85]">Speaker 1</span>
                  <span>00:01:14</span>
                </div>
                <p className="text-[#243447] font-medium">
                  "Let's finalize the launch date for the new feature."
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FDF5DF] border border-[#243447]/20 space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-[#5A6E85] font-bold">
                  <span className="text-[#5EBEC4]">Speaker 2</span>
                  <span>00:01:28</span>
                </div>
                <p className="text-[#243447] font-medium">
                  "How about September 12th? Alice can coordinate deployment."
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FDF5DF] border border-[#243447]/20 space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-[#5A6E85] font-bold">
                  <span className="text-[#243447]">Speaker 3</span>
                  <span>00:01:42</span>
                </div>
                <p className="text-[#243447] font-medium">
                  "I can handle the design updates before Wednesday."
                </p>
              </div>
            </div>
          </div>

          {/* CENTER: Waveform Processing Node */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center my-6 lg:my-0 text-center">
            
            {/* Center Animated Pulsing Mic/Wave Visual */}
            <div className="w-20 h-20 rounded-2xl bg-[#5EBEC4] border-2 border-[#243447] shadow-[4px_4px_0px_0px_#243447] flex items-center justify-center mb-4 transition-transform">
              <Mic className="w-10 h-10 text-[#243447] animate-pulse" />
            </div>

            {/* Stage Text Pill */}
            <div className="px-4 py-2 rounded-full bg-[#FFFFFF] border-2 border-[#243447] font-mono text-xs font-bold text-[#243447] shadow-[3px_3px_0px_0px_#F92C85] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F92C85] animate-ping" />
              {phase === 0 ? 'Listening...' : phase === 1 ? 'Understanding...' : 'Extracting Insights...'}
            </div>

            {/* Continuous Waveform Pulse */}
            <div className="flex items-center gap-1.5 mt-4 h-6">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="hand-waveform-bar" style={{ height: `${(i % 4) * 5 + 6}px` }} />
              ))}
            </div>
          </div>

          {/* RIGHT: Structured Meeting Notes */}
          <div className="lg:col-span-4 hand-card p-6 bg-[#FFFFFF]">
            <div className="flex items-center justify-between border-b-2 border-[#243447]/10 pb-3 mb-4">
              <span className="font-mono text-xs font-bold text-[#F92C85] uppercase tracking-wider">
                MEETING NOTES
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F5C84B] text-[#243447]">
                STRUCTURED
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Summary */}
              <div className="p-2.5 rounded-xl bg-[#FDF5DF] border border-[#243447]/20">
                <p className="font-bold text-[#243447] text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#5EBEC4]" /> Summary
                </p>
                <p className="text-[#5A6E85] text-[11px] leading-tight">
                  Team agreed to target September 12th launch. Alice is leading deployment, Speaker 3 is finishing designs by Wednesday.
                </p>
              </div>

              {/* Decisions */}
              <div className="p-2.5 rounded-xl bg-[#FDF5DF] border border-[#243447]/20">
                <p className="font-bold text-[#5EBEC4] text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5EBEC4]" /> Decisions
                </p>
                <p className="text-[#243447] text-[11px] font-medium">✓ September 12th Launch Approved</p>
              </div>

              {/* Action Items */}
              <div className="p-2.5 rounded-xl bg-[#FDF5DF] border border-[#243447]/20">
                <p className="font-bold text-[#F92C85] text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-[#F92C85]" /> Action Items
                </p>
                <div className="space-y-0.5 text-[#243447] text-[11px] font-medium">
                  <p>→ <span className="font-bold">Alice:</span> Coordinate deployment</p>
                  <p>→ <span className="font-bold">Speaker 3:</span> Design updates (Wed)</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
