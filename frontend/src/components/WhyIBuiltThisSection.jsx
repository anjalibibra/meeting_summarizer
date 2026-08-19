import React from 'react'
import { Heart, Laptop, BookOpen, Sparkles, Coffee } from 'lucide-react'

export default function WhyIBuiltThisSection() {
  return (
    <section id="why-i-built-this" className="py-20 paper-texture relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Hand-drawn Paper Note Card */}
        <div className="hand-card p-8 sm:p-14 bg-[#FFFFFF] relative">
          
          {/* Top Stamp Badge */}
          <div className="absolute -top-4 left-8 bg-[#5EBEC4] border-2 border-[#243447] px-3.5 py-1 rounded-md text-xs font-bold text-[#243447] shadow-[2px_2px_0px_0px_#243447] transform -rotate-2 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 fill-[#F92C85] text-[#F92C85]" />
            <span>CREATOR'S NOTE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Personal Narrative */}
            <div className="md:col-span-8 space-y-6">
              <h2 className="text-3xl sm:text-5xl font-bold text-[#243447] tracking-tight leading-tight">
                Meetings shouldn't disappear into recordings.
              </h2>

              <p className="text-[#243447]/90 text-base sm:text-lg leading-relaxed font-medium">
                I built Meeting Summarizer to turn long conversations into something you can actually use — a clear record of what was discussed, decided, and what needs to happen next.
              </p>

              <div className="pt-4 flex items-center justify-between border-t-2 border-[#243447]/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F5C84B] border-2 border-[#243447] flex items-center justify-center font-bold text-[#243447] shadow-[2px_2px_0px_0px_#243447]">
                    A
                  </div>
                  <div>
                    <span className="font-handwritten text-xl text-[#F92C85] font-bold block">
                      — Anjali ♡
                    </span>
                    <span className="text-xs text-[#5A6E85] font-mono">Creator & Developer</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-xs font-handwritten text-[#5EBEC4] font-bold">
                  <Coffee className="w-4 h-4 text-[#5EBEC4]" />
                  <span>crafted with care</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hand-drawn Desk / Notebook / Laptop Illustration */}
            <div className="md:col-span-4 flex justify-center">
              <div className="relative p-6 rounded-2xl bg-[#FDF5DF] border-2 border-[#243447] shadow-[4px_4px_0px_0px_#243447] text-center w-full max-w-xs">
                
                {/* SVG Notebook / Laptop Sketch */}
                <svg className="w-full h-auto max-h-40 mx-auto" viewBox="0 0 160 120" fill="none" stroke="#243447" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {/* Laptop Screen */}
                  <rect x="20" y="15" width="120" height="75" rx="8" fill="#FFFFFF" />
                  {/* Screen Content Doodle */}
                  <path d="M 40 35 L 120 35" stroke="#5EBEC4" strokeWidth="4" />
                  <path d="M 40 50 L 95 50" stroke="#F92C85" strokeWidth="4" />
                  <path d="M 40 65 L 110 65" stroke="#F5C84B" strokeWidth="4" />
                  {/* Laptop Base */}
                  <path d="M 10 90 L 150 90 A 5 5 0 0 1 155 95 L 5 95 A 5 5 0 0 1 10 90 Z" fill="#243447" />
                  {/* Coffee Cup beside Laptop */}
                  <rect x="135" y="70" width="16" height="20" rx="3" fill="#F92C85" stroke="#243447" strokeWidth="2" />
                  <path d="M 151 76 Q 157 80 151 86" stroke="#243447" strokeWidth="2" />
                </svg>

                <p className="font-handwritten text-xs text-[#243447] mt-3 font-bold">
                  simple · useful · human
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
