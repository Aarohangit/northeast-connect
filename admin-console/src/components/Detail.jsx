import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useData } from '../lib/data.jsx'
import { ago, CATEGORY_LABEL, clock, humanize, LANGUAGE_LABEL, plural, TEAM_TYPE_LABEL } from '../lib/format.js'
import { SeverityBadge, StatusBadge, Tag } from './Badges.jsx'

const ENGINE_LABEL = { gemini: 'Gemini', claude: 'Claude', rules: 'Rule engine' }

function Section({ title, right, children }) {
  return (
    <section className="border-b border-line-2 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  )
}

function Row({ k, children }) {
  return (
    <div className="flex gap-3 py-0.5 text-[13px]">
      <dt className="w-24 shrink-0 text-muted">{k}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  )
}

function Btn({ tone = 'plain', className = '', ...p }) {
  const cls = {
    primary: 'bg-ink text-white hover:bg-ink-2',
    go: 'bg-ok text-white hover:brightness-110',
    danger: 'border border-crit text-crit hover:bg-crit-bg',
    plain: 'border border-line bg-white text-ink hover:bg-canvas',
  }[tone]
  return <button type="button" className={`rounded-sm px-3 py-1.5 text-[13px] font-semibold disabled:opacity-50 ${cls} ${className}`} {...p} />
}

const inputCls = 'w-full rounded-sm border border-line px-2 py-1.5 text-[13px] outline-none focus:border-ink'

function useAction(onDone) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await onDone()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run }
}

function ReviewActions({ sos, done }) {
  const { user } = useAuth()
  const { busy, error, run } = useAction(done)
  const [note, setNote] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const dup = sos.triage?.possibleDuplicateOf
  const change = (status, n) =>
    run(() => api(`/api/sos/${sos.reference}/status`, { method: 'PATCH', body: { status, note: n, changedBy: user.username } }))

  return (
    <Section title="Decision">
      <textarea
        rows={2}
        className={inputCls}
        placeholder={rejecting ? 'Reason for rejecting (required, the citizen sees it)' : 'Note, e.g. "Called back, confirmed 4 people on roof"'}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {!rejecting ? (
          <>
            <Btn tone="go" disabled={busy} onClick={() => change('VERIFIED', note || 'Verified by control room')}>Verify request</Btn>
            {dup && <Btn disabled={busy} onClick={() => change('DUPLICATE', `Same incident as ${dup}`)}>Merge into {dup}</Btn>}
            <Btn tone="danger" disabled={busy} onClick={() => setRejecting(true)}>Reject…</Btn>
          </>
        ) : (
          <>
            <Btn tone="danger" disabled={busy || note.trim().length < 5} onClick={() => change('REJECTED', note.trim())}>Confirm reject</Btn>
            <Btn disabled={busy} onClick={() => setRejecting(false)}>Cancel</Btn>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-[13px] text-crit">{error}</p>}
    </Section>
  )
}

function DispatchActions({ sos, done }) {
  const { user } = useAuth()
  const { busy, error, run } = useAction(done)
  const [nearest, setNearest] = useState(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    let live = true
    api(`/api/teams/nearest?lat=${sos.latitude}&lng=${sos.longitude}&limit=5`)
      .then((r) => live && setNearest(r))
      .catch(() => live && setNearest([]))
    return () => { live = false }
  }, [sos.reference, sos.latitude, sos.longitude])

  const needsBoat = sos.triage?.needs?.includes('BOAT_RESCUE')

  return (
    <Section title="Dispatch a team" right={<span className="text-[11px] text-faint">nearest available first</span>}>
      <input className={`${inputCls} mb-2`} placeholder="Instruction for the team (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      {nearest === null && <p className="text-[13px] text-faint">Finding teams…</p>}
      {nearest?.length === 0 && <p className="text-[13px] text-crit">No team is available right now.</p>}
      <ul className="divide-y divide-line-2 rounded-sm border border-line">
        {nearest?.map(({ team, distanceKm }) => (
          <li key={team.id} className="flex items-center justify-between gap-2 px-2.5 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[13px] font-semibold">{team.code}</span>
                <span className="tabular text-[12px] font-semibold text-act">{distanceKm} km</span>
                {needsBoat && team.boats === 0 && <Tag tone="warn">No boat</Tag>}
              </div>
              <div className="truncate text-[11px] text-muted">
                {TEAM_TYPE_LABEL[team.type]} · {plural(team.members, 'member')} · {plural(team.boats, 'boat')} · {team.district}
              </div>
            </div>
            <Btn
              tone="primary"
              disabled={busy}
              onClick={() => run(() => api('/api/assignments', { method: 'POST', body: { sosReference: sos.reference, teamId: team.id, assignedBy: user.username, note: note || null } }))}
            >
              Dispatch
            </Btn>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-[13px] text-crit">{error}</p>}
    </Section>
  )
}

function ActiveActions({ sos, done }) {
  const { user } = useAuth()
  const { open } = useData()
  const { busy, error, run } = useAction(done)
  const op = open.find((a) => a.sosReference === sos.reference)
  const [rescued, setRescued] = useState(sos.triage?.peopleCount ?? sos.peopleCount ?? 1)
  const [mode, setMode] = useState(null)
  const [reason, setReason] = useState('')

  if (!op) return <Section title="Operation"><p className="text-[13px] text-faint">Loading operation…</p></Section>

  return (
    <Section title={`Operation #${op.id}`}>
      <dl className="mb-2">
        <Row k="Team"><span className="font-mono font-semibold">{op.teamCode}</span> · {op.teamName}</Row>
        <Row k="Dispatched">{clock(op.assignedAt)} by {op.assignedBy ?? '—'} ({ago(op.assignedAt)})</Row>
        {op.departedAt && <Row k="En route">since {clock(op.departedAt)}</Row>}
        {op.notes && <Row k="Notes">{op.notes}</Row>}
      </dl>
      {mode === null && (
        <div className="flex flex-wrap gap-2">
          {op.status === 'ASSIGNED' && (
            <Btn tone="primary" disabled={busy} onClick={() => run(() => api(`/api/assignments/${op.id}/depart`, { method: 'POST', body: { by: user.username } }))}>
              Mark en route
            </Btn>
          )}
          <Btn tone="go" disabled={busy} onClick={() => setMode('complete')}>Rescue completed…</Btn>
          <Btn tone="danger" disabled={busy} onClick={() => setMode('recall')}>Recall team…</Btn>
        </div>
      )}
      {mode === 'complete' && (
        <div className="flex items-end gap-2">
          <label className="text-[12px] text-muted">
            People rescued
            <input type="number" min={0} max={500} className={`${inputCls} mt-0.5 w-24`} value={rescued} onChange={(e) => setRescued(Number(e.target.value))} />
          </label>
          <Btn tone="go" disabled={busy} onClick={() => run(() => api(`/api/assignments/${op.id}/complete`, { method: 'POST', body: { peopleRescued: rescued, by: user.username } }))}>
            Confirm
          </Btn>
          <Btn disabled={busy} onClick={() => setMode(null)}>Cancel</Btn>
        </div>
      )}
      {mode === 'recall' && (
        <div>
          <input className={inputCls} placeholder="Why is the team being recalled?" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="mt-2 flex gap-2">
            <Btn tone="danger" disabled={busy || reason.trim().length < 3} onClick={() => run(() => api(`/api/assignments/${op.id}/cancel`, { method: 'POST', body: { reason: reason.trim(), by: user.username } }))}>
              Recall and return to queue
            </Btn>
            <Btn disabled={busy} onClick={() => setMode(null)}>Cancel</Btn>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-[13px] text-crit">{error}</p>}
    </Section>
  )
}

function Triage({ sos, onSelect }) {
  const t = sos.triage
  if (!t) {
    return (
      <Section title="AI triage">
        <p className="text-[13px] text-faint">Analysing the report… The request can be handled without it.</p>
      </Section>
    )
  }
  return (
    <Section
      title="AI triage"
      right={<span className="text-[10px] text-faint">{ENGINE_LABEL[t.engine] ?? t.engine}{t.model ? ` (${t.model})` : ''} · confidence {t.confidence?.toLowerCase()}</span>}
    >
      <div className="rounded-sm border border-line bg-canvas/60 p-2.5">
        <div className="flex items-center gap-2">
          <SeverityBadge sos={sos} size="lg" />
          {t.suggestedCategory && t.suggestedCategory !== sos.category && (
            <span className="text-[11px] text-muted">looks like: {CATEGORY_LABEL[t.suggestedCategory]}</span>
          )}
        </div>
        <p className="mt-1.5 text-[13px] font-medium">{t.summary}</p>
        <p className="mt-0.5 text-[12px] text-muted">{t.severityReason}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {t.waterLevel && t.waterLevel !== 'NOT_MENTIONED' && <Tag tone="info">Water: {humanize(t.waterLevel)}</Tag>}
          {t.waterRising && <Tag tone="crit">Water rising</Tag>}
          {t.needs.map((n) => <Tag key={n}>{humanize(n)}</Tag>)}
          {t.vulnerable.map((v) => <Tag key={v} tone="warn">{humanize(v)}</Tag>)}
          {t.medicalConditions.map((m) => <Tag key={m} tone="crit">{m}</Tag>)}
        </div>
        {t.locationHints.length > 0 && <p className="mt-2 text-[12px]"><span className="text-muted">Landmarks: </span>{t.locationHints.join(' · ')}</p>}
        {t.possibleDuplicateOf && (
          <button type="button" onClick={() => onSelect(t.possibleDuplicateOf)} className="mt-2 block text-left text-[12px] font-semibold text-high underline">
            Possible duplicate of {t.possibleDuplicateOf} (match {Math.round((t.duplicateScore ?? 0) * 100)}%) — open
          </button>
        )}
        {t.needsHumanReview && <p className="mt-1 text-[11px] font-semibold text-high">Flagged: check this one carefully.</p>}
      </div>
      <p className="mt-1.5 text-[10px] text-faint">Suggestion only. The duty officer makes the decision.</p>
    </Section>
  )
}

export default function Detail({ sos, onClose, onSelect }) {
  const { refresh } = useData()
  const [history, setHistory] = useState([])

  const loadHistory = () =>
    api(`/api/sos/${sos.reference}/status`).then((r) => setHistory(r.history)).catch(() => {})

  useEffect(() => { loadHistory() }, [sos.reference, sos.status]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = async () => {
    await refresh()
    await loadHistory()
  }

  const delayMin = sos.reportedAt ? Math.round((new Date(sos.receivedAt) - new Date(sos.reportedAt)) / 60000) : 0
  const showTranslation = sos.triage?.translation && sos.language !== 'en' && sos.triage.translation.trim() !== (sos.description ?? '').trim()

  return (
    <aside className="scroll-thin flex w-[440px] shrink-0 flex-col overflow-y-auto border-l border-line bg-panel">
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-panel px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-lg font-bold">{sos.reference}</h2>
            <StatusBadge status={sos.status} />
          </div>
          <p className="text-[12px] text-muted">{CATEGORY_LABEL[sos.category]} · received {ago(sos.receivedAt)}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-sm px-2 py-1 text-lg leading-none text-muted hover:bg-canvas" aria-label="Close">×</button>
      </div>

      {sos.status === 'RECEIVED' && <ReviewActions sos={sos} done={done} />}
      {sos.status === 'VERIFIED' && <DispatchActions sos={sos} done={done} />}
      {(sos.status === 'TEAM_ASSIGNED' || sos.status === 'IN_PROGRESS') && <ActiveActions sos={sos} done={done} />}

      <Triage sos={sos} onSelect={onSelect} />

      <Section title="Report from citizen">
        {sos.description ? <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{sos.description}</p> : <p className="text-[13px] text-faint">No description given.</p>}
        {showTranslation && (
          <div className="mt-2 border-l-2 border-line pl-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-faint">English translation (AI)</div>
            <p className="text-[13px] text-ink-2">{sos.triage.translation}</p>
          </div>
        )}
      </Section>

      <Section title="Caller">
        <dl>
          <Row k="Name">{sos.name}</Row>
          <Row k="Phone"><a href={`tel:${sos.phone}`} className="font-mono font-semibold text-act">{sos.phone}</a></Row>
          <Row k="People">{sos.peopleCount ?? '—'} reported in app{sos.triage?.peopleCount && sos.triage.peopleCount !== sos.peopleCount ? ` · ${sos.triage.peopleCount} per report text` : ''}</Row>
          <Row k="District">{sos.district ?? 'Not given'}</Row>
          <Row k="Language">{LANGUAGE_LABEL[sos.language] ?? sos.language ?? '—'}</Row>
          <Row k="Location">
            <span className="font-mono">{sos.latitude.toFixed(5)}, {sos.longitude.toFixed(5)}</span>
            {sos.accuracyMeters != null && <span className="text-muted"> ±{Math.round(sos.accuracyMeters)} m</span>}
            <a className="ml-2 text-[12px] font-semibold text-act" href={`https://www.google.com/maps?q=${sos.latitude},${sos.longitude}`} target="_blank" rel="noreferrer">Map ↗</a>
          </Row>
          <Row k="Delivery">
            {sos.channel === 'QUEUED_SYNC'
              ? <span className="text-high">Phone was offline · pressed {clock(sos.reportedAt)}, arrived {clock(sos.receivedAt)}{delayMin > 0 ? ` (${delayMin} min late)` : ''}</span>
              : <span>Direct · {clock(sos.receivedAt)}</span>}
          </Row>
        </dl>
      </Section>

      <Section title="History">
        <ol className="space-y-1.5">
          {history.map((h, i) => (
            <li key={i} className="flex gap-3 text-[12px]">
              <span className="tabular w-16 shrink-0 whitespace-nowrap font-mono text-faint">{clock(h.at)}</span>
              <span><span className="font-semibold">{humanize(h.status)}</span>{h.note ? ` — ${h.note}` : ''}</span>
            </li>
          ))}
        </ol>
      </Section>
    </aside>
  )
}
