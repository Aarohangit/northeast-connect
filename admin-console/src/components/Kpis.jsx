import { isOpen, severityOf } from '../lib/format.js'

function Kpi({ label, value, sub, tone }) {
  const color = { crit: 'text-crit', warn: 'text-high', ok: 'text-ok', act: 'text-act' }[tone] ?? 'text-ink'
  return (
    <div className="min-w-0 flex-1 rounded-xl bg-panel px-4 py-2.5 shadow-[0_1px_2px_rgb(15_34_55/0.05),0_2px_8px_rgb(15_34_55/0.04)]">
      <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className={`tabular text-[26px] font-bold leading-tight ${color}`}>{value}</div>
      {sub && <div className="truncate text-[11px] text-faint">{sub}</div>}
    </div>
  )
}

/** Every number here is counted from live records; nothing is estimated. */
export default function Kpis({ sos, teams, all }) {
  const open = sos.filter((s) => isOpen(s.status))
  const critical = open.filter((s) => severityOf(s) === 'CRITICAL').length
  const review = sos.filter((s) => s.status === 'RECEIVED').length
  // The rule engine marks everything for review, so only count real flags: model-raised or duplicates.
  const flagged = sos.filter((s) => s.status === 'RECEIVED' && (s.triage?.possibleDuplicateOf || (s.triage?.engine !== 'rules' && s.triage?.needsHumanReview))).length
  const awaitingDispatch = sos.filter((s) => s.status === 'VERIFIED').length
  const deployed = teams.filter((t) => t.status === 'DEPLOYED').length
  const available = teams.filter((t) => t.status === 'AVAILABLE').length
  const rescuedOps = all.filter((a) => a.status === 'COMPLETED')
  const peopleRescued = rescuedOps.reduce((n, a) => n + (a.peopleRescued ?? 0), 0)
  const delayed = open.filter((s) => s.channel === 'QUEUED_SYNC').length
  const peopleWaiting = open.reduce((n, s) => n + (s.triage?.peopleCount ?? s.peopleCount ?? 1), 0)

  return (
    <div className="flex shrink-0 gap-3 border-b border-line bg-canvas px-4 py-3">
      <Kpi label="Open requests" value={open.length} sub={`~${peopleWaiting} people waiting · ${sos.length} total`} />
      <Kpi label="Critical" value={critical} sub="AI-suggested, open" tone={critical ? 'crit' : undefined} />
      <Kpi label="Awaiting review" value={review} sub={flagged ? `${flagged} flagged for a closer look` : 'none flagged'} tone={review ? 'warn' : undefined} />
      <Kpi label="Ready to dispatch" value={awaitingDispatch} sub="verified, no team yet" tone={awaitingDispatch ? 'act' : undefined} />
      <Kpi label="Teams deployed" value={deployed} sub={`${available} available · ${teams.length} total`} />
      <Kpi label="People rescued" value={peopleRescued} sub={`${rescuedOps.length} operations completed`} tone="ok" />
      <Kpi label="Delayed delivery" value={delayed} sub="sent after phone was offline" />
    </div>
  )
}
