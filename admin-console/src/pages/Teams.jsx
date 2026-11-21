import { useState } from 'react'
import { api } from '../lib/api.js'
import { useData, useTick } from '../lib/data.jsx'
import { ago, clock, plural, TEAM_TYPE_LABEL } from '../lib/format.js'

const STATUS_STYLE = {
  AVAILABLE: 'bg-ok-bg text-ok',
  DEPLOYED: 'bg-high-bg text-high',
  OFF_DUTY: 'bg-line-2 text-faint',
}

const OP_STYLE = { ASSIGNED: 'text-act', EN_ROUTE: 'text-high', COMPLETED: 'text-ok', CANCELLED: 'text-faint' }

export default function Teams() {
  useTick()
  const { teams, open, all, refresh } = useData()
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const toggle = async (team) => {
    setBusyId(team.id)
    setError(null)
    try {
      await api(`/api/teams/${team.id}/availability`, { method: 'PATCH', body: { onDuty: team.status === 'OFF_DUTY' } })
      await refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const opFor = (teamId) => open.find((a) => a.teamId === teamId)
  const counts = { AVAILABLE: 0, DEPLOYED: 0, OFF_DUTY: 0 }
  teams.forEach((t) => counts[t.status]++)

  return (
    <div className="scroll-thin flex-1 overflow-y-auto p-5">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-lg font-bold">Rescue teams</h1>
            <p className="text-[13px] text-muted">{counts.AVAILABLE} available · {counts.DEPLOYED} deployed · {counts.OFF_DUTY} off duty</p>
          </div>
          {error && <p className="text-[13px] text-crit">{error}</p>}
        </div>

        <div className="overflow-hidden rounded-sm border border-line bg-panel">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-canvas text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Team</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">District</th>
                <th className="px-3 py-2 font-semibold">Strength</th>
                <th className="px-3 py-2 font-semibold">Leader</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Current operation</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {teams.map((t) => {
                const op = opFor(t.id)
                return (
                  <tr key={t.id}>
                    <td className="px-3 py-2"><div className="font-mono font-semibold">{t.code}</div><div className="text-[11px] text-muted">{t.name}</div></td>
                    <td className="px-3 py-2">{TEAM_TYPE_LABEL[t.type]}</td>
                    <td className="px-3 py-2">{t.district}</td>
                    <td className="tabular px-3 py-2">{plural(t.members, 'member')} · {plural(t.boats, 'boat')}</td>
                    <td className="px-3 py-2">{t.leaderName}<div><a href={`tel:${t.phone}`} className="font-mono text-[11px] text-act">{t.phone}</a></div></td>
                    <td className="px-3 py-2"><span className={`rounded-sm px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[t.status]}`}>{t.status.replace('_', ' ').toLowerCase()}</span></td>
                    <td className="px-3 py-2">
                      {op ? <><span className="font-mono font-semibold">{op.sosReference}</span> <span className={`text-[11px] ${OP_STYLE[op.status]}`}>{op.status.replace('_', ' ').toLowerCase()} · {ago(op.assignedAt)}</span></> : <span className="text-faint">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {t.status !== 'DEPLOYED' && (
                        <button type="button" disabled={busyId === t.id} onClick={() => toggle(t)}
                          className="rounded-sm border border-line px-2 py-1 text-[12px] font-semibold hover:bg-canvas disabled:opacity-50">
                          {t.status === 'OFF_DUTY' ? 'Bring on duty' : 'Stand down'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-bold">Operations log</h2>
          <div className="overflow-hidden rounded-sm border border-line bg-panel">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-line bg-canvas text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">#</th>
                  <th className="px-3 py-2 font-semibold">SOS</th>
                  <th className="px-3 py-2 font-semibold">Team</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Dispatched</th>
                  <th className="px-3 py-2 font-semibold">Closed</th>
                  <th className="px-3 py-2 font-semibold">Rescued</th>
                  <th className="px-3 py-2 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-2">
                {all.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-faint">No operations yet.</td></tr>}
                {all.map((a) => (
                  <tr key={a.id}>
                    <td className="tabular px-3 py-2 text-faint">{a.id}</td>
                    <td className="px-3 py-2 font-mono font-semibold">{a.sosReference}</td>
                    <td className="px-3 py-2 font-mono">{a.teamCode}</td>
                    <td className={`px-3 py-2 text-[12px] font-semibold ${OP_STYLE[a.status]}`}>{a.status.replace('_', ' ').toLowerCase()}</td>
                    <td className="tabular px-3 py-2">{clock(a.assignedAt)} <span className="text-[11px] text-faint">by {a.assignedBy ?? '—'}</span></td>
                    <td className="tabular px-3 py-2">{a.closedAt ? clock(a.closedAt) : '—'}</td>
                    <td className="tabular px-3 py-2">{a.peopleRescued ?? '—'}</td>
                    <td className="max-w-xs truncate px-3 py-2 text-[12px] text-muted" title={a.notes ?? ''}>{a.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
