import { SEVERITY, STATUS_LABEL, severityMeta } from '../lib/format.js'

export function SeverityBadge({ sos, size = 'sm' }) {
  const m = severityMeta(sos)
  const pad = size === 'lg' ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm font-bold uppercase tracking-wide ${pad} ${m.bg} ${m.text}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  )
}

export function SeverityKey() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
      {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'PENDING'].map((k) => (
        <span key={k} className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY[k].color }} />
          {SEVERITY[k].label}
        </span>
      ))}
    </div>
  )
}

const STATUS_STYLE = {
  RECEIVED: 'border-pend text-ink-2',
  VERIFIED: 'border-act text-act',
  TEAM_ASSIGNED: 'border-ok text-ok',
  IN_PROGRESS: 'border-ok text-ok',
  RESCUED: 'border-ok bg-ok-bg text-ok',
  REJECTED: 'border-line text-faint',
  DUPLICATE: 'border-line text-faint',
}

export function StatusBadge({ status }) {
  return (
    <span className={`whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export function Tag({ children, tone = 'plain', title }) {
  const cls = {
    plain: 'bg-line-2 text-ink-2',
    warn: 'bg-high-bg text-high',
    info: 'bg-low-bg text-low',
    crit: 'bg-crit-bg text-crit',
  }[tone]
  return (
    <span title={title} className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${cls}`}>
      {children}
    </span>
  )
}
