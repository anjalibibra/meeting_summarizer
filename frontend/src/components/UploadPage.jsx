import React from 'react'
import Navbar from './Navbar'
import HeroSection from './HeroSection'
import UploadArea from './UploadArea'
import HowItWorksSection from './HowItWorksSection'
import AiTransformationSection from './AiTransformationSection'
import WhyIBuiltThisSection from './WhyIBuiltThisSection'
import FeaturesSection from './FeaturesSection'
import { Mic, Heart, Coffee } from 'lucide-react'

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-[#FDF5DF] text-[#243447] paper-texture selection:bg-[#F92C85]/30">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section with Human Hand + Laptop + Robot Hand Animation */}
      <HeroSection />

      {/* Upload Console Area */}
      <UploadArea />

      {/* 3-Step How It Works Section */}
      <HowItWorksSection />

      {/* RAW RECORDING -> Understanding -> MEETING NOTES Transformation */}
      <AiTransformationSection />

      {/* Why I Built This (Personal Anjali section) */}
      <WhyIBuiltThisSection />

      {/* What You Get Features Section */}
      <FeaturesSection />

      {/* Footer */}
      <footer className="border-t-2 border-[#243447]/10 bg-[#FFFFFF] py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5EBEC4] border-2 border-[#243447] flex items-center justify-center text-[#243447] shadow-[2.5px_2.5px_0px_0px_#243447]">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#243447] text-base block">
                Meeting Summarizer
              </span>
              <span className="text-xs font-handwritten text-[#F92C85] font-bold">
                conversation → clarity
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono font-bold text-[#5A6E85]">
            <span>Local Whisper ASR</span>
            <span>·</span>
            <span>Neural Diarization</span>
            <span>·</span>
            <span>100% Private</span>
          </div>

          <div className="text-xs font-handwritten font-bold text-[#243447] flex items-center gap-1.5 bg-[#FDF5DF] px-3 py-1.5 rounded-full border border-[#243447]">
            <Heart className="w-3.5 h-3.5 fill-[#F92C85] text-[#F92C85]" />
            <span>designed & built by Anjali</span>
          </div>

        </div>
      </footer>
    </div>
  )
}
