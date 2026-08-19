import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mic, Upload, Activity } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-[#FDF5DF]/90 backdrop-blur-md border-b-2 border-[#243447]/10 py-4 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-[#5EBEC4] border-2 border-[#243447] flex items-center justify-center shadow-[3px_3px_0px_0px_#243447] group-hover:bg-[#F92C85] transition-colors duration-200">
            <Mic className="w-5 h-5 text-[#243447] group-hover:text-white transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-[#243447]">
              Meeting Summarizer
            </span>
            <span className="text-[11px] font-handwritten text-[#5EBEC4] -mt-1 font-bold">
              conversation → clarity
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#243447]">
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-[#F92C85] transition-colors font-medium"
          >
            How it works
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-[#F92C85] transition-colors font-medium"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('why-i-built-this')}
            className="hover:text-[#F92C85] transition-colors font-medium flex items-center gap-1"
          >
            Why I built this
          </button>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => scrollToSection('upload-area')}
            className="btn-pink px-5 py-2.5 text-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload recording</span>
          </button>
        </div>

      </div>
    </header>
  )
}
