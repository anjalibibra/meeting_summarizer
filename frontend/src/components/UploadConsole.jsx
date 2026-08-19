import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mic,
  UploadCloud,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Radio,
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react'
import { uploadAudio } from '../api'

const ACCEPTED_FORMATS = '.mp3, .wav, .m4a, .ogg, .flac, .webm'
const MAX_MB = 500

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadConsole() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState(null)

  const handleFileSelect = useCallback((file) => {
    if (!file) return
    setErrorMessage(null)

    if (file.size > MAX_MB * 1024 * 1024) {
      setErrorMessage(`File size (${formatFileSize(file.size)}) exceeds the maximum allowed ${MAX_MB} MB limit.`)
      return
    }

    setSelectedFile(file)
  }, [])

  const onInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
    e.target.value = ''
  }

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0])
      }
    },
    [handleFileSelect]
  )

  const onDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const onDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleStartProcessing = async () => {
    if (!selectedFile || uploading) return
    setUploading(true)
    setErrorMessage(null)
    setUploadProgress(0)

    try {
      const jobId = await uploadAudio(selectedFile, (pct) => {
        setUploadProgress(pct)
      })
      // Once HTTP upload finishes, immediately route to status console for processing pipeline
      navigate(`/status/${jobId}`)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to upload recording. Please verify the file format and try again.'
      setErrorMessage(msg)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div id="upload-console" className="w-full max-w-4xl mx-auto my-12">
      {/* Outer Console Glow Container */}
      <div className="relative group">
        {/* Glow backdrop behind console */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-600/30 via-indigo-600/30 to-cyan-500/30 blur-2xl opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-300" />

        {/* Main Console Box */}
        <div className="relative rounded-3xl bg-[#0d111d]/90 backdrop-blur-2xl border border-slate-800/80 hover:border-violet-500/50 shadow-2xl p-6 sm:p-10 transition-all duration-300">
          
          {/* Console Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400/40" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40" />
              <div className="w-3 h-3 rounded-full bg-green-500/80 border border-green-400/40" />
              <span className="ml-2 font-mono text-xs text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                AI Voice Console v2.0
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                ASR & Diarization Ready
              </span>
            </div>
          </div>

          {/* Interactive Drop Area */}
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12 text-center cursor-pointer overflow-hidden ${
              dragOver
                ? 'border-violet-500 bg-violet-500/10 scale-[1.01] shadow-2xl shadow-violet-500/20'
                : selectedFile
                ? 'border-indigo-500/60 bg-indigo-950/20'
                : 'border-slate-800 hover:border-violet-500/40 bg-slate-950/40 hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              onChange={onInputChange}
              className="hidden"
              id="ai-file-input"
            />

            {/* Background Animated Waveform Pattern */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none gap-1">
              {Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{
                    height: `${Math.floor(Math.sin(i) * 30 + 35)}px`,
                    animationDelay: `${(i % 10) * 0.1}s`,
                  }}
                />
              ))}
            </div>

            {selectedFile ? (
              <div className="relative z-10 flex flex-col items-center">
                {/* File Icon with glowing ring */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-violet-600/30 mb-4 animate-bounce-short">
                  <FileAudio className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
                  {selectedFile.name}
                </h3>
                <p className="text-sm text-slate-400 font-mono mb-4">
                  {formatFileSize(selectedFile.size)} · Audio File Loaded
                </p>

                {!uploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 underline tracking-wide transition-colors"
                  >
                    Select a different recording
                  </button>
                )}
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center">
                {/* Pulsing Microphone Visual */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl shadow-violet-500/25 group-hover:scale-105 transition-transform duration-300">
                    <div className="w-full h-full rounded-[14px] bg-[#0d111d] flex items-center justify-center">
                      <Mic className="w-9 h-9 text-violet-400 group-hover:text-cyan-300 transition-colors" />
                    </div>
                  </div>
                  {/* Outer animated radar ring */}
                  <div className="absolute -inset-3 rounded-3xl border border-violet-500/30 radar-pulse pointer-events-none" />
                </div>

                {/* Animated Waveform Visual Indicator */}
                <div className="flex items-center justify-center gap-1.5 mb-5 h-8">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="waveform-bar" />
                  ))}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  Drop your meeting recording here
                </h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                  Drag and drop your audio file or click to browse. The AI console will handle transcription, speaker labels, and key extraction.
                </p>

                {/* Supported Format Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
                  {['MP3', 'WAV', 'M4A', 'OGG', 'FLAC', 'WEBM'].map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-slate-900/80 text-slate-400 border border-slate-800"
                    >
                      .{fmt.toLowerCase()}
                    </span>
                  ))}
                  <span className="text-xs text-slate-500 font-mono ml-1">Up to {MAX_MB} MB</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress Bar (When Active) */}
          {uploading && (
            <div className="mt-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
                <span className="flex items-center gap-2 text-violet-300">
                  <Zap className="w-4 h-4 text-cyan-400 animate-spin" />
                  Uploading Recording to AI Pipeline…
                </span>
                <span className="font-bold text-violet-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-3 text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">Upload Validation Error</p>
                <p className="text-xs text-red-300/90 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Private local processing available · No cloud leakage</span>
            </div>

            <button
              onClick={handleStartProcessing}
              disabled={!selectedFile || uploading}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-xl ${
                selectedFile && !uploading
                  ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-violet-600/30 hover:shadow-violet-600/50 hover:-translate-y-0.5 cursor-pointer'
                  : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <span>{uploading ? 'Processing…' : 'Transcribe & Generate Summary'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
