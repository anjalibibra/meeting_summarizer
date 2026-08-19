import React, { useState, useEffect } from 'react'
import { Mic, FileText, CheckCircle2, CheckSquare, Sparkles, Activity } from 'lucide-react'

export default function HeroVisual() {
  const [screenState, setScreenState] = useState(0) // 0: TRANSCRIPT, 1: SUMMARY, 2: ACTION ITEMS

  useEffect(() => {
    const interval = setInterval(() => {
      setScreenState((prev) => (prev + 1) % 3)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full max-w-5xl mx-auto py-12 px-4 select-none">
      
      {/* Hand-drawn Annotation 1 */}
      <div className="absolute top-2 left-6 sm:left-12 z-20 transform -rotate-6 hidden sm:block">
        <div className="font-handwritten text-sm text-[#F92C85] bg-[#FDF5DF] px-3 py-1 rounded-full border border-[#F92C85] shadow-[2px_2px_0px_0px_#F92C85]">
          human + AI ♡
        </div>
        <svg className="w-8 h-8 text-[#F92C85] ml-4 mt-1" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 10 Q25 35 40 40 M32 30 L40 40 L30 45" />
        </svg>
      </div>

      {/* Hand-drawn Annotation 2 */}
      <div className="absolute top-0 right-6 sm:right-16 z-20 transform rotate-3 hidden sm:block">
        <div className="font-handwritten text-sm text-[#5EBEC4] bg-[#FFFFFF] px-3 py-1 rounded-full border-2 border-[#243447] shadow-[3px_3px_0px_0px_#243447]">
          turn conversations into clarity ✦
        </div>
      </div>

      {/* Hand-drawn Annotation 3 */}
      <div className="absolute bottom-4 left-1/4 z-20 transform rotate-2 hidden md:block">
        <span className="font-handwritten text-xs text-[#243447] bg-[#F5C84B] px-2.5 py-0.5 rounded-md border border-[#243447]">
          same meeting, less chaos
        </span>
      </div>

      {/* Main Composition Container */}
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-2">
        
        {/* LEFT: Human Hand Illustration */}
        <div className="w-48 sm:w-64 shrink-0 flex flex-col items-center animate-hand-human z-10">
          <svg className="w-full h-auto drop-shadow-[4px_4px_0px_#243447]" viewBox="0 0 240 180" fill="none" stroke="#243447" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Human Hand & Arm reaching right */}
            <path d="M 0 110 C 30 110, 50 100, 90 95 C 110 92, 135 90, 150 90" fill="#FDF5DF" />
            <path d="M 0 145 C 40 145, 60 135, 100 130 C 130 125, 145 120, 160 110" fill="#FDF5DF" />
            {/* Human Fingers */}
            <path d="M 150 90 Q 175 88 190 92 Q 198 96 190 102 Q 165 105 155 105" fill="#FDF5DF" />
            <path d="M 160 102 Q 185 102 195 108 Q 200 114 190 118 Q 165 118 150 116" fill="#FDF5DF" />
            <path d="M 155 116 Q 175 118 185 124 Q 188 130 178 132 Q 155 130 145 125" fill="#FDF5DF" />
            {/* Thumb */}
            <path d="M 115 94 Q 130 75 145 70 Q 152 75 142 88 Q 130 94 125 96" fill="#FDF5DF" />
            {/* Cuff accent */}
            <path d="M 35 92 L 30 152" stroke="#F92C85" strokeWidth="4" />
          </svg>
          <span className="font-handwritten text-xs text-[#243447] mt-1 bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#243447]">
            Human Speaker
          </span>
        </div>

        {/* CONTINUOUS FLOWING WAVEFORM CONNECTOR 1 (Human -> Laptop) */}
        <div className="relative flex-1 h-12 flex items-center justify-center overflow-hidden my-2 md:my-0">
          <svg className="w-full h-12" viewBox="0 0 200 40" fill="none">
            {/* Base Wave Line */}
            <path d="M 0 20 Q 25 5, 50 20 T 100 20 T 150 20 T 200 20" stroke="#5EBEC4" strokeWidth="3" strokeDasharray="4 4" />
            {/* Flowing animated pulse dots */}
            <circle cx="20" cy="20" r="5" fill="#F92C85" className="wave-flow-particle" />
            <circle cx="80" cy="20" r="4" fill="#F5C84B" className="wave-flow-particle" style={{ animationDelay: '0.8s' }} />
            <circle cx="140" cy="20" r="5" fill="#5EBEC4" className="wave-flow-particle" style={{ animationDelay: '1.6s' }} />
          </svg>
        </div>

        {/* CENTER: Laptop Representing Meeting Summarizer */}
        <div className="w-72 sm:w-96 shrink-0 relative z-20">
          {/* Laptop Lid/Screen */}
          <div className="rounded-t-2xl bg-[#243447] p-3 border-4 border-[#243447] shadow-[6px_6px_0px_0px_rgba(36,52,71,0.3)]">
            {/* Webcam dot */}
            <div className="w-2 h-2 rounded-full bg-[#5EBEC4] mx-auto mb-2" />

            {/* Laptop Display Screen */}
            <div className="rounded-xl bg-[#FFFFFF] p-4 min-h-[210px] border-2 border-[#243447] flex flex-col justify-between relative overflow-hidden">
              
              {/* Screen Top Status Bar */}
              <div className="flex items-center justify-between border-b-2 border-[#243447]/10 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F92C85]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F5C84B]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#5EBEC4]" />
                  <span className="font-mono text-[10px] font-bold text-[#243447] ml-1">
                    Meeting Summarizer OS
                  </span>
                </div>

                {/* Animated Screen State Tabs */}
                <div className="flex gap-1 font-mono text-[9px] font-bold">
                  <span className={`px-1.5 py-0.5 rounded ${screenState === 0 ? 'bg-[#5EBEC4] text-[#243447]' : 'text-slate-400'}`}>
                    TRANSCRIPT
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${screenState === 1 ? 'bg-[#F92C85] text-white' : 'text-slate-400'}`}>
                    SUMMARY
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${screenState === 2 ? 'bg-[#F5C84B] text-[#243447]' : 'text-slate-400'}`}>
                    ACTIONS
                  </span>
                </div>
              </div>

              {/* Dynamic Updating Laptop Display Content */}
              <div className="flex-1 transition-all duration-500">
                {screenState === 0 && (
                  <div className="space-y-2 text-[11px] animate-fadeIn">
                    <div className="flex items-center gap-1.5 font-bold text-[#5EBEC4]">
                      <Mic className="w-3.5 h-3.5" />
                      <span>Live Audio Waveform</span>
                    </div>
                    <div className="flex items-center gap-1 h-6 py-1">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="hand-waveform-bar" style={{ height: `${(i % 5) * 4 + 8}px` }} />
                      ))}
                    </div>
                    <div className="p-2 rounded-lg bg-[#FDF5DF] border border-[#243447]/20 text-[#243447]">
                      <span className="font-bold text-[#F92C85]">Speaker 1:</span> "We'll launch the product update by Friday morning..."
                    </div>
                  </div>
                )}

                {screenState === 1 && (
                  <div className="space-y-2 text-[11px] animate-fadeIn">
                    <div className="flex items-center gap-1.5 font-bold text-[#F92C85]">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Structured AI Summary</span>
                    </div>
                    <p className="text-[#243447] text-[11px] leading-tight bg-[#FDF5DF] p-2 rounded-lg border border-[#243447]/20">
                      The team agreed to deploy the v2 update by Friday. Alice will coordinate release operations while Bob completes regression tests.
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-[#5EBEC4] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Key Decision: Friday Release Approved
                    </div>
                  </div>
                )}

                {screenState === 2 && (
                  <div className="space-y-1.5 text-[11px] animate-fadeIn">
                    <div className="flex items-center gap-1.5 font-bold text-[#243447]">
                      <CheckSquare className="w-3.5 h-3.5 text-[#F92C85]" />
                      <span>Action Items Checklist</span>
                    </div>
                    <div className="p-1.5 rounded-md bg-[#FDF5DF] border border-[#243447]/20 flex items-center justify-between">
                      <span>✓ Alice: Deploy API build</span>
                      <span className="px-1 py-0.2 rounded bg-[#F92C85] text-white text-[9px] font-bold">HIGH</span>
                    </div>
                    <div className="p-1.5 rounded-md bg-[#FDF5DF] border border-[#243447]/20 flex items-center justify-between">
                      <span>✓ Bob: Complete test suite</span>
                      <span className="px-1 py-0.2 rounded bg-[#5EBEC4] text-[#243447] text-[9px] font-bold">MED</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Screen Indicator */}
              <div className="pt-2 border-t border-[#243447]/10 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1 text-[#5EBEC4]">
                  <Activity className="w-3 h-3 animate-pulse" /> Processing Engine Active
                </span>
                <span>Page {screenState + 1} of 3</span>
              </div>
            </div>
          </div>

          {/* Laptop Base Keyboard */}
          <div className="h-4 bg-[#243447] rounded-b-xl border-t-2 border-[#FFFFFF]/20 shadow-[0px_4px_0px_0px_#243447] relative">
            <div className="w-16 h-1.5 bg-[#FFFFFF]/30 rounded-full mx-auto mt-1" />
          </div>
        </div>

        {/* CONTINUOUS FLOWING WAVEFORM CONNECTOR 2 (Laptop -> Robot) */}
        <div className="relative flex-1 h-12 flex items-center justify-center overflow-hidden my-2 md:my-0">
          <svg className="w-full h-12" viewBox="0 0 200 40" fill="none">
            <path d="M 0 20 Q 25 35, 50 20 T 100 20 T 150 20 T 200 20" stroke="#F92C85" strokeWidth="3" strokeDasharray="4 4" />
            <circle cx="20" cy="20" r="5" fill="#5EBEC4" className="wave-flow-particle" />
            <circle cx="80" cy="20" r="5" fill="#F92C85" className="wave-flow-particle" style={{ animationDelay: '0.6s' }} />
            <circle cx="140" cy="20" r="4" fill="#F5C84B" className="wave-flow-particle" style={{ animationDelay: '1.4s' }} />
          </svg>
        </div>

        {/* RIGHT: Robot Hand Illustration */}
        <div className="w-48 sm:w-64 shrink-0 flex flex-col items-center animate-hand-robot z-10">
          <svg className="w-full h-auto drop-shadow-[4px_4px_0px_#243447]" viewBox="0 0 240 180" fill="none" stroke="#243447" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Robot Arm reaching left */}
            <path d="M 240 110 C 210 110, 190 100, 150 95 C 130 92, 105 90, 90 90" fill="#FFFFFF" />
            <path d="M 240 145 C 200 145, 180 135, 140 130 C 110 125, 95 120, 80 110" fill="#FFFFFF" />
            {/* Robot Joint Circles */}
            <circle cx="150" cy="95" r="8" fill="#5EBEC4" />
            <circle cx="140" cy="130" r="8" fill="#F5C84B" />
            {/* Robot Fingers / Mechanical Grippers */}
            <path d="M 90 90 Q 65 88 50 92 Q 42 96 50 102 Q 75 105 85 105" fill="#FFFFFF" />
            <path d="M 80 102 Q 55 102 45 108 Q 40 114 50 118 Q 75 118 90 116" fill="#FFFFFF" />
            <path d="M 85 116 Q 65 118 55 124 Q 52 130 62 132 Q 85 130 95 125" fill="#FFFFFF" />
            {/* Robot Sensor Light Ring */}
            <circle cx="60" cy="92" r="3" fill="#F92C85" />
            <circle cx="55" cy="108" r="3" fill="#5EBEC4" />
            {/* Robot Wrist Band */}
            <path d="M 205 92 L 210 152" stroke="#5EBEC4" strokeWidth="4" />
          </svg>
          <span className="font-handwritten text-xs text-[#243447] mt-1 bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#243447]">
            Robot Assistant
          </span>
        </div>

      </div>
    </div>
  )
}
