import React from 'react'
import { Upload, ArrowRight, Sparkles, Mic } from 'lucide-react'
import HeroVisual from './HeroVisual'

export default function HeroSection() {
  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative pt-8 pb-16 overflow-hidden paper-texture">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Headline Container */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Handwritten Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFFFFF] text-[#243447] border-2 border-[#243447] shadow-[3px_3px_0px_0px_#5EBEC4]">
            <Sparkles className="w-3.5 h-3.5 text-[#F92C85]" />
            <span>✦ HUMAN CONVERSATION + AI INTELLIGENCE</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#243447] leading-[1.05]">
            Meetings in.<br />
            <span className="text-[#5EBEC4]">Clarity</span> out.
          </h1>

          {/* Supporting Copy */}
          <p className="text-[#243447]/90 text-lg sm:text-xl font-normal max-w-2xl mx-auto leading-relaxed">
            Upload a recording and get the conversation, decisions, and next steps — without listening to the whole thing again.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => scrollToSection('upload-area')}
              className="btn-pink px-8 py-4 text-base flex items-center justify-center gap-2.5 w-full sm:w-auto"
            >
              <Upload className="w-5 h-5" />
              <span>Upload recording</span>
            </button>

            <button
              onClick={() => scrollToSection('how-it-works')}
              className="btn-teal-outline px-7 py-4 text-base flex items-center justify-center gap-2.5 w-full sm:w-auto"
            >
              <span>See how it works</span>
              <ArrowRight className="w-4 h-4 text-[#5EBEC4]" />
            </button>
          </div>

        </div>

        {/* Hero Visual: Human Hand + Laptop + Robot Hand Animation */}
        <HeroVisual />

      </div>
    </section>
  )
}
