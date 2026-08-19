import React, { useState } from 'react'
import { Play, Volume2, ShieldCheck, Sparkles, Monitor, Maximize2 } from 'lucide-react'

export default function DemoVideoSection() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section id="demo-section" className="py-24 relative overflow-hidden bg-[#07090e]">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 mb-4">
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            Interactive Product Tour
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            See Meeting Summarizer in action
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Experience how AI transforms raw meeting audio into structured, decision-ready intelligence.
          </p>
        </div>

        {/* Browser Frame Container */}
        <div className="max-w-5xl mx-auto relative group">
          
          {/* Subtle outer glow */}
          <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-violet-600/30 via-indigo-600/30 to-cyan-500/30 blur-xl opacity-50 group-hover:opacity-80 transition duration-500" />

          {/* Main Browser Window */}
          <div className="relative rounded-[24px] bg-[#0d111d] border border-slate-800/90 shadow-2xl overflow-hidden backdrop-blur-2xl">
            
            {/* macOS Browser Chrome Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#090c14] border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400/30" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/30" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/30" />
              </div>

              {/* URL Address Bar */}
              <div className="flex-1 max-w-md mx-4 px-4 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-center font-mono text-xs text-slate-400 flex items-center justify-center gap-2 truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">app.meetingsummarizer.ai/demo/q3-roadmap-sync</span>
              </div>

              <div className="flex items-center gap-3 text-slate-500 text-xs font-mono">
                <span className="hidden sm:inline">1080p AI Mode</span>
              </div>
            </div>

            {/* Video / Interactive Player Viewport */}
            <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
              
              {/* Actual Video Tag (Supports user's video file or poster) */}
              <video
                controls={isPlaying}
                className="w-full h-full object-cover"
                poster="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'><rect width='1200' height='675' fill='%2307090e'/><circle cx='600' cy='337' r='200' fill='%237c3aed' opacity='0.15' filter='blur(60px)'/><text x='600' y='320' font-family='sans-serif' font-size='28' font-weight='bold' fill='%23f8fafc' text-anchor='middle'>Meeting Summarizer Live Demo</text><text x='600' y='360' font-family='monospace' font-size='16' fill='%2394a3b8' text-anchor='middle'>Click to Play Interactive Audio Stream</text></svg>"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src="/demo_video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Play Overlay Button (Visible before play) */}
              {!isPlaying && (
                <div
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer group/play transition duration-300"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-1 shadow-2xl shadow-violet-500/40 group-hover/play:scale-110 transition-transform duration-300">
                    <div className="w-full h-full rounded-full bg-[#0d111d] flex items-center justify-center">
                      <Play className="w-8 h-8 text-white fill-white ml-1 group-hover/play:text-cyan-300 transition-colors" />
                    </div>
                  </div>
                  <p className="mt-4 font-semibold text-sm text-white tracking-wide">
                    Watch 1-Minute Walkthrough
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Voice Upload → Speaker Labeling → Structured Summary
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
