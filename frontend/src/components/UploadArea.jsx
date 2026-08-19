import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mic,
  Upload,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Lock
} from 'lucide-react'
import { uploadAudio } from '../api'

const ACCEPTED_FORMATS = '.mp3, .wav, .m4a, .ogg, .flac, .webm'
const MAX_MB = 500

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadArea() {
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
      setErrorMessage(`File size (${formatFileSize(file.size)}) exceeds the max allowed ${MAX_MB} MB limit.`)
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
      navigate(`/status/${jobId}`)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to upload recording. Please check the file and try again.'
      setErrorMessage(msg)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div id="upload-area" className="w-full max-w-4xl mx-auto my-12 px-4 select-none">
      
      {/* Outer Hand-drawn Card */}
      <div className="hand-card p-6 sm:p-10 relative bg-[#FFFFFF]">
        
        {/* Yellow Scribble Badge Accent */}
        <div className="absolute -top-4 right-8 bg-[#F5C84B] border-2 border-[#243447] px-3 py-1 rounded-md text-xs font-bold text-[#243447] shadow-[2px_2px_0px_0px_#243447] transform rotate-2">
          ✦ RECORDING READY
        </div>

        {/* Console Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-[#243447]/10 pb-5 mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-[#243447]">
            <div className="w-3 h-3 rounded-full bg-[#F92C85] border border-[#243447]" />
            <div className="w-3 h-3 rounded-full bg-[#F5C84B] border border-[#243447]" />
            <div className="w-3 h-3 rounded-full bg-[#5EBEC4] border border-[#243447]" />
            <span className="ml-1 font-mono uppercase tracking-wider">
              WORKSPACE AUDIO INGESTION
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#5EBEC4]">
            <Zap className="w-3.5 h-3.5 fill-[#5EBEC4]" />
            <span>Local Engine Active</span>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12 text-center cursor-pointer overflow-hidden ${
            dragOver
              ? 'border-[#F92C85] bg-[#F92C85]/10 scale-[1.01]'
              : selectedFile
              ? 'border-[#5EBEC4] bg-[#5EBEC4]/10'
              : 'border-[#5EBEC4]/60 hover:border-[#5EBEC4] bg-[#FDF5DF]/60 hover:bg-[#FDF5DF]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FORMATS}
            onChange={onInputChange}
            className="hidden"
            id="audio-file-input"
          />

          {selectedFile ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#5EBEC4] border-2 border-[#243447] flex items-center justify-center shadow-[4px_4px_0px_0px_#243447] mb-4">
                <FileAudio className="w-8 h-8 text-[#243447]" />
              </div>

              <h3 className="text-xl font-bold text-[#243447] mb-1">
                {selectedFile.name}
              </h3>
              <p className="text-sm text-[#5A6E85] font-mono mb-4">
                {formatFileSize(selectedFile.size)} · Recording Ready
              </p>

              {!uploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                  }}
                  className="text-xs text-[#F92C85] hover:underline font-bold"
                >
                  Choose a different file
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Microphone in Teal */}
              <div className="w-16 h-16 rounded-2xl bg-[#5EBEC4] border-2 border-[#243447] flex items-center justify-center shadow-[4px_4px_0px_0px_#243447] mb-4 group-hover:bg-[#F92C85] transition-colors">
                <Mic className="w-8 h-8 text-[#243447]" />
              </div>

              {/* Teal Animated Audio Waveform */}
              <div className="flex items-center justify-center gap-1.5 mb-5 h-8">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="hand-waveform-bar" style={{ height: `${(i % 5) * 4 + 10}px` }} />
                ))}
              </div>

              <h3 className="text-2xl font-bold text-[#243447] mb-2 tracking-tight">
                Drop your meeting recording here
              </h3>
              <p className="text-[#5A6E85] text-sm max-w-md mx-auto mb-6 font-medium">
                or click to browse your local computer
              </p>

              {/* Supported Format Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {['MP3', 'WAV', 'M4A', 'OGG', 'FLAC', 'WEBM'].map((fmt) => (
                  <span
                    key={fmt}
                    className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#FFFFFF] text-[#243447] border border-[#243447]/30 shadow-[1.5px_1.5px_0px_0px_#243447]"
                  >
                    .{fmt.toLowerCase()}
                  </span>
                ))}
                <span className="text-xs text-[#5A6E85] font-mono ml-2">Up to {MAX_MB} MB</span>
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="mt-6 p-4 rounded-xl bg-[#FDF5DF] border-2 border-[#243447]">
            <div className="flex items-center justify-between text-xs font-bold text-[#243447] mb-2">
              <span className="flex items-center gap-2 text-[#F92C85]">
                <Sparkles className="w-4 h-4 text-[#F92C85] animate-spin" />
                Uploading & Initializing AI Pipeline…
              </span>
              <span className="font-mono text-[#5EBEC4]">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-[#FFFFFF] rounded-full h-3 overflow-hidden border-2 border-[#243447]">
              <div
                className="bg-[#F92C85] h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border-2 border-[#243447] flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Upload Validation Error</p>
              <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Footer Bar with Privacy Notice & Pink Submit Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-[#243447]/10 pt-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5A6E85]">
            <Lock className="w-4 h-4 text-[#5EBEC4]" />
            <span>Your data is processed locally. It never leaves your device.</span>
          </div>

          <button
            onClick={handleStartProcessing}
            disabled={!selectedFile || uploading}
            className={`btn-pink px-8 py-3.5 text-sm flex items-center justify-center gap-2.5 w-full sm:w-auto ${
              !selectedFile || uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span>{uploading ? 'Processing…' : 'Transcribe & Generate Summary'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  )
}
