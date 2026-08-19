import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Cpu,
  Mic,
  Users,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Activity,
  Sparkles,
  Zap
} from 'lucide-react'
import { getJobStatus } from '../api'

const STAGE_LABELS = {
  pending: { label: 'Queued', icon: Clock, color: 'text-[#243447]' },
  uploading: { label: 'Uploading', icon: Mic, color: 'text-[#5EBEC4]' },
  transcribing: { label: 'Transcribing Audio', icon: Mic, color: 'text-[#5EBEC4]' },
  diarizing: { label: 'Identifying Speakers', icon: Users, color: 'text-[#F92C85]' },
  summarizing: { label: 'Generating Summary', icon: FileText, color: 'text-[#F92C85]' },
  verifying: { label: 'Verifying Summary', icon: ShieldCheck, color: 'text-[#5EBEC4]' },
  completed: { label: 'Complete', icon: CheckCircle2, color: 'text-[#5EBEC4]' },
  failed: { label: 'Failed', icon: AlertCircle, color: 'text-[#F92C85]' },
}

const POLL_INTERVAL_MS = 2000

export default function StatusPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const data = await getJobStatus(Number(jobId))
        if (cancelled) return

        setJob(data)

        if (data.status === 'completed') {
          navigate(`/results/${jobId}`)
          return
        }

        if (data.status === 'failed') {
          return
        }

        pollRef.current = setTimeout(poll, POLL_INTERVAL_MS)
      } catch (err) {
        if (cancelled) return
        setError(err.response?.data?.detail || 'Could not reach server. Retrying…')
        pollRef.current = setTimeout(poll, POLL_INTERVAL_MS * 2)
      }
    }

    poll()

    return () => {
      cancelled = true
      clearTimeout(pollRef.current)
    }
  }, [jobId, navigate])

  const stageInfo = job ? (STAGE_LABELS[job.status] || STAGE_LABELS.pending) : STAGE_LABELS.pending
  const StageIcon = stageInfo.icon

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 paper-texture">
      <div className="w-full max-w-2xl">
        
        {/* Hand-drawn Card Console */}
        <div className="hand-card p-8 sm:p-10 bg-[#FFFFFF] relative">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b-2 border-[#243447]/10 pb-5 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F92C85] border border-[#243447]" />
              <div className="w-3 h-3 rounded-full bg-[#F5C84B] border border-[#243447]" />
              <div className="w-3 h-3 rounded-full bg-[#5EBEC4] border border-[#243447]" />
              <span className="ml-2 font-mono text-xs font-bold text-[#243447] uppercase tracking-wider">
                PROCESSING PIPELINE · JOB #{jobId}
              </span>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#5EBEC4]/20 text-[#243447] border border-[#5EBEC4]">
              Processing Audio
            </span>
          </div>

          {/* Current Stage */}
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#5EBEC4] border-2 border-[#243447] flex items-center justify-center shadow-[4px_4px_0px_0px_#243447]">
              <StageIcon className="w-8 h-8 text-[#243447] animate-pulse" />
            </div>

            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#5A6E85] mb-1">
                Current Pipeline Stage
              </p>
              <h2 className="text-3xl font-bold text-[#243447] tracking-tight">
                {stageInfo.label}
              </h2>
            </div>
          </div>

          {/* Progress Bar */}
          {job && job.status !== 'failed' && (
            <div className="mb-8 p-5 rounded-2xl bg-[#FDF5DF] border-2 border-[#243447]">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#243447] mb-2">
                <span className="truncate max-w-xs">{job.progress_message || 'Executing steps…'}</span>
                <span className="text-[#F92C85]">{Math.round(job.progress_percent || 0)}%</span>
              </div>
              <div className="w-full bg-[#FFFFFF] rounded-full h-3 overflow-hidden border-2 border-[#243447]">
                <div
                  className="bg-[#F92C85] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${job.progress_percent || 0}%` }}
                />
              </div>
            </div>
          )}

          {/* File Meta */}
          {job && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FDF5DF] border-2 border-[#243447] text-xs font-mono text-[#243447] mb-8">
              <div>
                <span className="text-[#5A6E85] block mb-0.5 font-bold">Recording File</span>
                <span className="font-bold truncate block" title={job.original_filename}>
                  {job.original_filename}
                </span>
              </div>
              <div>
                <span className="text-[#5A6E85] block mb-0.5 font-bold">Duration</span>
                <span className="font-bold block">
                  {job.duration_seconds
                    ? `${Math.round(job.duration_seconds / 60)}m ${Math.round(job.duration_seconds % 60)}s`
                    : 'Calculating…'}
                </span>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {job?.status === 'failed' && (
            <div className="p-4 rounded-xl bg-red-50 border-2 border-[#243447] text-sm text-red-900 mb-6">
              <p className="font-bold mb-1">Pipeline Error</p>
              <p className="text-xs text-red-700">{job.error_message || 'An unexpected error occurred.'}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#F92C85] font-bold underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to home page
              </button>
            </div>
          )}

          {/* Execution Sequence */}
          <div className="border-t-2 border-[#243447]/10 pt-6">
            <p className="text-xs font-mono uppercase tracking-widest text-[#5A6E85] font-bold mb-4">
              Execution Sequence
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['transcribing', Mic, 'ASR Transcription'],
                ['diarizing', Users, 'Neural Diarization'],
                ['summarizing', FileText, 'LLM Summarization'],
                ['verifying', ShieldCheck, 'Verification Pass'],
              ].map(([stageKey, IconComponent, stageTitle]) => {
                const stages = ['pending', 'uploading', 'transcribing', 'diarizing', 'summarizing', 'verifying', 'completed']
                const currentIdx = stages.indexOf(job?.status || 'pending')
                const stageIdx = stages.indexOf(stageKey)
                const isDone = currentIdx > stageIdx
                const isActive = currentIdx === stageIdx

                return (
                  <div
                    key={stageKey}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-[#5EBEC4]/20 border-[#5EBEC4] text-[#243447]'
                        : isActive
                        ? 'bg-[#F92C85] border-[#243447] text-white shadow-[2px_2px_0px_0px_#243447]'
                        : 'bg-[#FDF5DF] border-[#243447]/30 text-[#5A6E85]'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                        isDone
                          ? 'bg-[#5EBEC4] text-[#243447]'
                          : isActive
                          ? 'bg-[#FFFFFF] text-[#F92C85]'
                          : 'bg-[#FFFFFF] text-[#5A6E85] border border-[#243447]'
                      }`}
                    >
                      {isDone ? '✓' : isActive ? '●' : '○'}
                    </div>
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span>{stageTitle}</span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
