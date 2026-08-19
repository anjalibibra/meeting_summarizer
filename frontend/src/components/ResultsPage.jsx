import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FileText,
  CheckSquare,
  Mic,
  Clock,
  Users,
  AlertTriangle,
  ArrowLeft,
  Copy,
  Download,
  Check,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { getResults } from '../api'
import ActionItemsList from './ActionItemsList'
import SummaryCard from './SummaryCard'
import TranscriptViewer from './TranscriptViewer'
import { generateMeetingPdf } from '../utils/generateMeetingPdf'

function formatDuration(seconds) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m} min`
}

export default function ResultsPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [copied, setCopied] = useState(false)
  const [pdfState, setPdfState] = useState('idle') // 'idle' | 'preparing' | 'ready'

  useEffect(() => {
    async function fetchResults() {
      try {
        const result = await getResults(Number(jobId))
        if (result.job.status !== 'completed') {
          navigate(`/status/${jobId}`, { replace: true })
          return
        }
        setData(result)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load meeting results.')
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [jobId, navigate])

  const handleNewMeeting = () => {
    navigate('/')
  }

  const handleCopySummary = () => {
    if (!data?.summary) return
    const textToCopy = `MEETING SUMMARY: ${data.job.original_filename}
${data.summary.executive_summary}

KEY DECISIONS:
${data.summary.key_decisions.map((d) => `- ${d.decision}`).join('\n')}

ACTION ITEMS:
${data.summary.action_items.map((a) => `- [${a.priority.toUpperCase()}] ${a.task} (Owner: ${a.owner}, Due: ${a.deadline})`).join('\n')}
`
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadPdf = async () => {
    if (!data) return
    setPdfState('preparing')
    try {
      // Generate PDF client-side
      await new Promise((r) => setTimeout(r, 400)) // brief UX feedback
      generateMeetingPdf(data)
      setPdfState('ready')
      setTimeout(() => setPdfState('idle'), 2500)
    } catch (err) {
      console.error('PDF Generation Error:', err)
      setPdfState('idle')
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 paper-texture">
        <div className="hand-card p-8 space-y-6 animate-pulse bg-[#FFFFFF]">
          <div className="h-8 bg-[#5EBEC4]/20 rounded-xl w-1/3" />
          <div className="h-4 bg-[#FDF5DF] rounded-lg w-2/3" />
          <div className="h-48 bg-[#FDF5DF] rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 paper-texture">
        <div className="hand-card p-8 text-center space-y-4 bg-red-50 border-red-700">
          <AlertTriangle className="w-12 h-12 text-[#F92C85] mx-auto" />
          <h3 className="text-xl font-bold text-[#243447]">Error Loading Results</h3>
          <p className="text-xs text-red-700 font-mono">{error}</p>
          <button
            onClick={handleNewMeeting}
            className="btn-pink px-6 py-2.5 text-xs inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Upload
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { job, transcript, summary } = data
  const verificationFlags = summary?.verification_flags || []
  const flaggedCount = verificationFlags.filter((f) => f.confidence !== 'supported').length

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 paper-texture">
      
      {/* Top Header Row with ← New Meeting Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-[#243447]/10 pb-8">
        <div>
          {/* ← New Meeting Button */}
          <button
            onClick={handleNewMeeting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FDF5DF] text-[#243447] text-xs font-bold border-2 border-[#243447] shadow-[2px_2px_0px_0px_#243447] transition-all mb-4"
          >
            <ArrowLeft className="w-4 h-4 text-[#F92C85]" />
            <span>← New Meeting</span>
          </button>

          <h1 className="text-2xl sm:text-4xl font-bold text-[#243447] tracking-tight">
            {job.original_filename}
          </h1>

          {/* Useful Metadata Below Filename */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-mono font-bold">
            <span className="px-3 py-1 rounded-full bg-[#FFFFFF] text-[#243447] border-2 border-[#243447] flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#5EBEC4]">
              <Clock className="w-3.5 h-3.5 text-[#5EBEC4]" />
              ◷ {formatDuration(job.duration_seconds)}
            </span>

            {transcript && (
              <span className="px-3 py-1 rounded-full bg-[#FFFFFF] text-[#243447] border-2 border-[#243447] flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#F5C84B]">
                <Users className="w-3.5 h-3.5 text-[#243447]" />
                👥 {transcript.num_speakers} Speakers
              </span>
            )}

            {summary && (
              <span className="px-3 py-1 rounded-full bg-[#FFFFFF] text-[#243447] border-2 border-[#243447] flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#F92C85]">
                <CheckSquare className="w-3.5 h-3.5 text-[#F92C85]" />
                ✓ {summary.action_items?.length || 0} Actions
              </span>
            )}

            {flaggedCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-[#F5C84B] text-[#243447] border-2 border-[#243447] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F92C85]" />
                {flaggedCount} Flagged
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Copy Summary & Download PDF */}
        <div className="flex items-center gap-3">
          {/* Copy Summary Button */}
          <button
            onClick={handleCopySummary}
            className="px-4 py-2.5 rounded-xl bg-[#FFFFFF] text-[#243447] font-bold text-xs border-2 border-[#243447] shadow-[2.5px_2.5px_0px_0px_#5EBEC4] hover:bg-[#5EBEC4]/10 transition-all flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">✓ Summary copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#5EBEC4]" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          {/* Prominent Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={pdfState === 'preparing'}
            className="btn-pink px-5 py-2.5 text-xs flex items-center gap-2"
          >
            {pdfState === 'preparing' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Preparing your meeting report...</span>
              </>
            ) : pdfState === 'ready' ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>✓ PDF ready</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Flagged Alert Banner */}
      {flaggedCount > 0 && (
        <div className="p-4 rounded-2xl bg-[#F5C84B] border-2 border-[#243447] text-[#243447] text-xs sm:text-sm flex items-start gap-3 shadow-[3px_3px_0px_0px_#243447]">
          <AlertTriangle className="w-5 h-5 text-[#F92C85] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">
              {flaggedCount} item{flaggedCount !== 1 ? 's' : ''} flagged during AI self-verification pass
            </p>
            <p className="text-xs text-[#243447]/90 mt-1 leading-relaxed font-medium">
              These action items or decisions could not be unequivocally confirmed against the verbatim recording transcript. Inspect items marked with <span className="underline font-bold">⚠ Review</span> or <span className="underline font-bold">⚡ Unverified</span> before finalizing meeting minutes.
            </p>
          </div>
        </div>
      )}

      {/* Main Tab Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#FFFFFF] border-2 border-[#243447] shadow-[3px_3px_0px_0px_#243447] max-w-md">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'summary'
              ? 'bg-[#5EBEC4] text-[#243447] border border-[#243447]'
              : 'text-[#5A6E85] hover:text-[#243447]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'actions'
              ? 'bg-[#F92C85] text-white border border-[#243447]'
              : 'text-[#5A6E85] hover:text-[#243447]'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Actions ({summary?.action_items?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'transcript'
              ? 'bg-[#F5C84B] text-[#243447] border border-[#243447]'
              : 'text-[#5A6E85] hover:text-[#243447]'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Transcript</span>
        </button>
      </div>

      {/* Active Tab Viewport */}
      <div>
        {activeTab === 'summary' && <SummaryCard summary={summary} />}
        {activeTab === 'actions' && (
          <ActionItemsList
            actionItems={summary?.action_items || []}
            verificationFlags={verificationFlags}
          />
        )}
        {activeTab === 'transcript' && <TranscriptViewer transcript={transcript} />}
      </div>

      {/* Footer Navigation */}
      <div className="pt-8 border-t-2 border-[#243447]/10 flex items-center justify-between text-xs font-mono font-bold text-[#5A6E85]">
        <button
          onClick={handleNewMeeting}
          className="hover:text-[#F92C85] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Start another meeting
        </button>

        <span>Meeting Summarizer Engine</span>
      </div>
    </div>
  )
}
