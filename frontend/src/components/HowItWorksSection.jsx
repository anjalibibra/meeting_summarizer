import React, { useState, useEffect } from 'react'
import { Mic, Cpu, FileText, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % 3) + 1)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="how-it-works" className="py-20 relative paper-texture overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFFFFF] text-[#243447] border-2 border-[#243447] shadow-[2px_2px_0px_0px_#5EBEC4] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#F92C85]" />
            Continuous Journey
          </div>
          <h2 className="text-4xl sm:text-6xl font-bold text-[#243447] tracking-tight mb-3">
            How it works
          </h2>
          <p className="text-[#5A6E85] text-lg font-medium">
            From conversation to clarity in 3 simple steps.
          </p>
        </div>

        {/* Continuous Hand-Drawn Waveform Connecting Pipeline */}
        <div className="relative">
          
          {/* Animated Connecting Waveform Line across desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 -translate-y-12 z-0">
            <svg className="w-full h-16" viewBox="0 0 1000 60" fill="none">
              <path
                d="M 100 30 Q 250 5, 400 30 T 700 30 T 900 30"
                stroke="#5EBEC4"
                strokeWidth="4"
                strokeDasharray="6 6"
              />
              <circle
                cx={activeStep === 1 ? '160' : activeStep === 2 ? '500' : '840'}
                cy="30"
                r="8"
                fill="#F92C85"
                className="transition-all duration-700 ease-in-out"
              />
            </svg>
          </div>

          {/* 3 Interactive Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            
            {/* STEP 01 */}
            <div
              className={`hand-card p-8 flex flex-col justify-between transition-all duration-300 ${
                activeStep === 1 ? 'border-[#F92C85] shadow-[6px_6px_0px_0px_#F92C85] -translate-y-2' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-handwritten text-sm font-bold text-[#243447] bg-[#F5C84B] px-3 py-1 rounded-md border border-[#243447]">
                    01 RECORD
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-[#5EBEC4] border-2 border-[#243447] flex items-center justify-center text-[#243447] shadow-[3px_3px_0px_0px_#243447]">
                    <Mic className="w-6 h-6" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-[#243447] mb-3">
                  Upload your meeting recording
                </h3>
                <p className="text-[#5A6E85] text-sm leading-relaxed mb-6 font-medium">
                  Drop your meeting audio into the workspace. Supports MP3, WAV, M4A, OGG, and WebM files up to 500 MB.
                </p>
              </div>

              {/* Animated Micro Waveform */}
              <div className="p-3.5 rounded-xl bg-[#FDF5DF] border-2 border-[#243447] flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#243447]">Audio Stream Ready</span>
                <div className="flex items-center gap-1 h-5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="hand-waveform-bar"
                      style={{ height: activeStep === 1 ? `${(i % 4) * 4 + 8}px` : '6px' }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 02 */}
            <div
              className={`hand-card p-8 flex flex-col justify-between transition-all duration-300 ${
                activeStep === 2 ? 'border-[#F92C85] shadow-[6px_6px_0px_0px_#F92C85] -translate-y-2' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-handwritten text-sm font-bold text-[#243447] bg-[#5EBEC4] px-3 py-1 rounded-md border border-[#243447]">
                    02 UNDERSTAND
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-[#F5C84B] border-2 border-[#243447] flex items-center justify-center text-[#243447] shadow-[3px_3px_0px_0px_#243447]">
                    <Cpu className="w-6 h-6" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-[#243447] mb-3">
                  AI understands conversation
                </h3>
                <p className="text-[#5A6E85] text-sm leading-relaxed mb-6 font-medium">
                  AI transcribes the conversation, identifies distinct speakers with neural diarization, and extracts key insights.
                </p>
              </div>

              {/* Speaker Diarization Mock */}
              <div className="p-3.5 rounded-xl bg-[#FDF5DF] border-2 border-[#243447] space-y-1.5 text-xs">
                <div className="flex justify-between font-mono text-[10px] font-bold text-[#243447]">
                  <span className="speaker-chip speaker-0 text-[9px]">Speaker 1</span>
                  <span className="text-[#F92C85]">Diarizing...</span>
                </div>
                <p className="text-[#243447] text-[11px] italic">"We'll approve the launch date..."</p>
              </div>
            </div>

            {/* STEP 03 */}
            <div
              className={`hand-card p-8 flex flex-col justify-between transition-all duration-300 ${
                activeStep === 3 ? 'border-[#F92C85] shadow-[6px_6px_0px_0px_#F92C85] -translate-y-2' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-handwritten text-sm font-bold text-white bg-[#F92C85] px-3 py-1 rounded-md border border-[#243447]">
                    03 ORGANIZE
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-[#F92C85] border-2 border-[#243447] flex items-center justify-center text-white shadow-[3px_3px_0px_0px_#243447]">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-[#243447] mb-3">
                  Get structured summary
                </h3>
                <p className="text-[#5A6E85] text-sm leading-relaxed mb-6 font-medium">
                  Get a structured summary with decisions, action items with assigned owners, deadlines, and open questions.
                </p>
              </div>

              {/* Document Lines Animated */}
              <div className="p-3.5 rounded-xl bg-[#FDF5DF] border-2 border-[#243447] space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#243447]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5EBEC4]" />
                  <span>3 Action Items Extracted</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-[#243447]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F92C85]" />
                  <span>2 Key Decisions Approved</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
