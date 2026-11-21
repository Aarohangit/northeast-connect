import { useTick } from '../lib/data.jsx'
import { ago, bySeverityThenAge, CATEGORY_LABEL } from '../lib/format.js'
import { SeverityBadge, StatusBadge, Tag } from './Badges.jsx'

export const TABS = [
  { id: 'review', label: 'Review', match: (s) => s.status === 'RECEIVED' },
  { id: 'dispatch', label: 'Dispatch', match: (s) => s.status === 'VERIFIED' },
  { id: 'active', label: 'Active', match: (s) => s.status === 'TEAM_ASSIGNED' || s.status === 'IN_PROGRESS' },
  { id: 'closed', label: 'Closed', match: (s) => ['RESCUED', 'REJECTED', 'DUPLICATE'].includes(s.status) },
]

export default function Queue({ sos, tab, setTab, district, setDistrict, districts, selected, onSelect }) {
  useTick()
  const inDistrict = sos.filter((s) => !district || s.district === district)
  const current = TABS.find((t) => t.id === tab)
  const rows = inDistrict.filter(current.match).sort(
    tab === 'closed' ? (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt) : bySeverityThenAge,
  )

  return (
    <section className="flex w-[380px] shrink-0 flex-col border-r border-line bg-panel">
      <div className="border-b border-line px-3 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted">SOS queue</h2>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="rounded-sm border border-line bg-white px-1.5 py-0.5 text-xs"
            aria-label="Filter by district"
          >
            <option value="">All districts</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex" role="tablist">
          {TABS.map((t) => {
            const n = inDistrict.filter(t.match).length
            const active = t.id === tab
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`-mb-px flex-1 border-b-2 px-1 pb-2 text-[13px] font-semibold ${active ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}
              >
                {t.label} <span className={`tabular ml-0.5 rounded-sm px-1 text-[11px] ${active ? 'bg-ink text-white' : 'bg-line-2'}`}>{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      <ul className="scroll-thin flex-1 overflow-y-auto">
        {rows.length === 0 && <li className="p-6 text-center text-sm text-faint">Nothing here right now.</li>}
        {rows.map((s) => {
          const active = selected === s.reference
          return (
            <li key={s.reference}>
              <button
                type="button"
                onClick={() => onSelect(s.reference)}
                className={`block w-full border-b border-line-2 px-3 py-2.5 text-left hover:bg-canvas ${active ? 'bg-low-bg shadow-[inset_3px_0_0_#1f5f99]' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold">{s.reference}</span>
                    <SeverityBadge sos={s} />
                  </div>
                  <span className="tabular whitespace-nowrap text-[11px] text-faint">{ago(s.receivedAt)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-2">
                  {s.triage?.summary || s.description || CATEGORY_LABEL[s.category]}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-[11px] text-muted">{s.district ?? 'District unknown'}</span>
                  {tab === 'closed' && <StatusBadge status={s.status} />}
                  {s.triage?.possibleDuplicateOf && s.status === 'RECEIVED' && <Tag tone="warn">Possible duplicate</Tag>}
                  {s.triage?.engine === 'claude' && s.triage.needsHumanReview && s.status === 'RECEIVED' && !s.triage.possibleDuplicateOf && <Tag>Check carefully</Tag>}
                  {s.channel === 'QUEUED_SYNC' && <Tag tone="info" title="The phone was offline and sent this later">Delayed</Tag>}
                  {s.triage?.waterRising && <Tag tone="crit">Water rising</Tag>}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
