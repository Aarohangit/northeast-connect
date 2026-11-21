import { useEffect, useRef } from 'react'
import { useData } from '../lib/data.jsx'
import { CATEGORY_LABEL } from '../lib/format.js'
import { SeverityBadge } from './Badges.jsx'

/** Two short beeps, generated in the browser so there is no sound file to load. */
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[0, 0.22].forEach((t) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = 880
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.18)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.2)
    })
  } catch {
    /* audio blocked until the officer interacts with the page */
  }
}

export default function IncomingAlerts({ onOpen }) {
  const { incoming, dismiss, sos } = useData()
  const seen = useRef(0)

  useEffect(() => {
    if (incoming.length > seen.current) beep()
    seen.current = incoming.length
    const base = 'Northeast Connect · Control Room'
    document.title = incoming.length ? `(${incoming.length}) New SOS · ${base}` : base
  }, [incoming.length])

  if (!incoming.length) return null
  return (
    <div className="pointer-events-none fixed right-4 top-16 z-[2000] flex w-[360px] flex-col gap-2" role="alert" aria-live="assertive">
      {incoming.map((s) => {
        const live = sos.find((x) => x.reference === s.reference) ?? s
        return (
          <div key={s.reference} className="pointer-events-auto overflow-hidden rounded-xl border border-crit/30 bg-white shadow-[0_12px_30px_rgb(15_34_55/0.25)]">
            <div className="flex items-center justify-between bg-crit px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> New SOS</span>
              <button type="button" onClick={() => dismiss(s.reference)} className="text-white/80 hover:text-white" aria-label="Dismiss">×</button>
            </div>
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold">{s.reference}</span>
                <SeverityBadge sos={live} />
              </div>
              <p className="mt-1 line-clamp-2 text-[13px] text-ink-2">{live.triage?.summary || s.description || CATEGORY_LABEL[s.category]}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-muted">{s.district ?? 'District unknown'} · {CATEGORY_LABEL[s.category]}</span>
                <button type="button" onClick={() => { onOpen(s.reference); dismiss(s.reference) }}
                  className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white hover:bg-ink-2">Open</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
