import React, { useState } from 'react'
import {
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  Zap,
  User,
  Calendar,
  Info
} from 'lucide-react'

function findFlag(flags, task) {
  if (!flags || !flags.length) return null
  const normalised = task.trim().toLowerCase()
  return (
    flags.find(
      (f) =>
        f.item_type === 'action_item' &&
        f.item_text.trim().toLowerCase() === normalised
    ) || null
  )
}

function VerificationBadge({ flag }) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!flag) return null

  const { confidence, flag_reason } = flag

  let badgeClass = ''
  let badgeText = ''
  let IconComponent = CheckCircle2

  if (confidence === 'supported') {
    badgeClass = 'flag-badge flag-supported'
    badgeText = '✓ Verified'
    IconComponent = CheckCircle2
  } else if (confidence === 'uncertain') {
    badgeClass = 'flag-badge flag-uncertain'
    badgeText = '⚠ Needs Review'
    IconComponent = AlertTriangle
  } else if (confidence === 'likely_hallucinated') {
    badgeClass = 'flag-badge flag-hallucinated'
    badgeText = '⚡ Unverified'
    IconComponent = Zap
  } else {
    return null
  }

  return (
    <div className="relative inline-block">
      <span
        className={badgeClass}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        role="status"
      >
        <IconComponent className="w-3 h-3" />
        {badgeText}
      </span>
      {showTooltip && flag_reason && (
        <div className="absolute right-0 top-7 z-20 rounded-xl p-3 text-xs w-64 shadow-2xl bg-[#FFFFFF] border-2 border-[#243447] text-[#243447] leading-relaxed font-sans font-medium">
          <p className="font-bold text-[#243447] mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide">
            <Info className="w-3 h-3 text-[#5EBEC4]" />
            Verification Finding
          </p>
          <p className="text-[#5A6E85] text-[11px]">{flag_reason}</p>
        </div>
      )}
    </div>
  )
}

function PriorityBadge({ priority }) {
  let colorClass = 'priority-medium'
  let label = '● MED'
  if (priority === 'high') {
    colorClass = 'priority-high'
    label = '● HIGH'
  } else if (priority === 'low') {
    colorClass = 'priority-low'
    label = '● LOW'
  }

  return <span className={colorClass}>{label}</span>
}

function ActionItemCard({ item, flag, checked, onToggle }) {
  const isProblematic =
    flag && (flag.confidence === 'uncertain' || flag.confidence === 'likely_hallucinated')

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border-2 border-[#243447] transition-all duration-200 ${
        checked
          ? 'bg-[#FDF5DF] opacity-60'
          : isProblematic
          ? 'bg-amber-50 shadow-[3px_3px_0px_0px_#F5C84B]'
          : 'bg-[#FDF5DF] shadow-[3px_3px_0px_0px_#5EBEC4]'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(item.task)}
          className={`mt-0.5 shrink-0 w-5 h-5 rounded-lg flex items-center justify-center font-bold text-xs border-2 border-[#243447] transition-all ${
            checked
              ? 'bg-[#F92C85] text-white'
              : 'bg-[#FFFFFF] text-transparent hover:border-[#F92C85]'
          }`}
          aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
        >
          ✓
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <p
              className={`font-bold text-sm sm:text-base leading-snug ${
                checked ? 'line-through text-[#5A6E85]' : 'text-[#243447]'
              }`}
            >
              {item.task}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <PriorityBadge priority={item.priority} />
              <VerificationBadge flag={flag} />
            </div>
          </div>

          {/* Meta details */}
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-[#243447]/10 text-xs font-mono font-bold text-[#5A6E85]">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#F92C85]" />
              <span className={item.owner === 'unassigned' ? 'italic text-[#5A6E85]' : 'text-[#243447]'}>
                {item.owner}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#5EBEC4]" />
              <span className={item.deadline === 'not specified' ? 'italic text-[#5A6E85]' : 'text-[#243447]'}>
                {item.deadline}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ActionItemsList({ actionItems = [], verificationFlags = [] }) {
  const [checkedTasks, setCheckedTasks] = useState(new Set())

  const toggleChecked = (task) => {
    setCheckedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(task)) next.delete(task)
      else next.add(task)
      return next
    })
  }

  if (!actionItems.length) {
    return (
      <div className="hand-card p-10 text-center bg-[#FFFFFF]">
        <CheckSquare className="w-12 h-12 text-[#5A6E85] mx-auto mb-3" />
        <p className="text-[#243447] font-bold text-lg">No action items recorded</p>
        <p className="text-[#5A6E85] text-sm mt-1">
          No explicit task commitments were identified in this recording session.
        </p>
      </div>
    )
  }

  const doneCount = checkedTasks.size
  const totalCount = actionItems.length
  const flaggedCount = actionItems.filter((item) => {
    const flag = findFlag(verificationFlags, item.task)
    return flag && flag.confidence !== 'supported'
  }).length

  return (
    <div className="hand-card p-6 sm:p-8 bg-[#FFFFFF] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#243447]/10 pb-6">
        <div>
          <h3 className="text-xl font-bold text-[#243447] flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#F92C85]" />
            Action Items & Task Checklist
          </h3>
          <p className="text-xs text-[#5A6E85] font-mono mt-1 font-bold">
            {doneCount} of {totalCount} completed
            {flaggedCount > 0 && (
              <span className="ml-2 text-[#F92C85]">
                · {flaggedCount} flagged for review
              </span>
            )}
          </p>
        </div>

        <div className="w-full sm:w-48 bg-[#FDF5DF] rounded-full h-3 overflow-hidden border-2 border-[#243447]">
          <div
            className="bg-[#F92C85] h-full transition-all duration-300"
            style={{ width: `${(doneCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        {actionItems.map((item, i) => (
          <ActionItemCard
            key={i}
            item={item}
            flag={findFlag(verificationFlags, item.task)}
            checked={checkedTasks.has(item.task)}
            onToggle={toggleChecked}
          />
        ))}
      </div>

      {/* Legend */}
      {verificationFlags.length > 0 && (
        <div className="pt-4 border-t-2 border-[#243447]/10 flex flex-wrap items-center gap-3 text-xs font-mono font-bold text-[#5A6E85]">
          <span className="flag-badge flag-supported">✓ Verified</span>
          <span className="flag-badge flag-uncertain">⚠ Needs Review</span>
          <span className="flag-badge flag-hallucinated">⚡ Unverified</span>
          <span>Hover badges to inspect verification pass findings.</span>
        </div>
      )}
    </div>
  )
}
