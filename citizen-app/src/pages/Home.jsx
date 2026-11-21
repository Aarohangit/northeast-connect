import { Link } from 'react-router'
import { Card, NetworkBadge, SampleTag } from '../components/Layout.jsx'
import { Icon } from '../components/icons.jsx'
import { ALERT, HELPLINES, STATES, stateForDistrict, stateOf } from '../data/reference.js'
import { useLang } from '../i18n/index.jsx'
import { useHomeState } from '../lib/region.js'
import { useSituation } from '../lib/situation.js'
import { useSync } from '../lib/sync.jsx'
import { DeliveryChip } from './RequestStatus.jsx'

function Tile({ to, icon, title, sub, tone }) {
  const Glyph = Icon[icon]
  return (
    <Link to={to}>
      <Card className="h-full p-3">
        <span className={`mb-2 inline-flex rounded-md p-1.5 ${tone}`}><Glyph width={18} height={18} /></span>
        <div className="text-sm font-semibold leading-tight">{title}</div>
        <div className="mt-0.5 text-[11px] leading-snug text-ink-soft">{sub}</div>
      </Card>
    </Link>
  )
}

export default function Home() {
  const { t, lang } = useLang()
  const { records } = useSync()
  const [homeState, setHomeState] = useHomeState()
  const { data } = useSituation()
  const state = stateOf(homeState)

  const inState = (data?.districts ?? []).filter((d) => stateForDistrict(d.district)?.code === homeState)
  const stateOpen = inState.reduce((n, d) => n + d.open, 0)
  const stateCritical = inState.reduce((n, d) => n + d.critical, 0)
  const topAreas = (data?.districts ?? []).filter((d) => d.open > 0).slice(0, 3)

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-sos p-3">
        <div className="mb-1 flex items-center gap-2 text-sos">
          <Icon.Alert width={16} height={16} />
          <span className="text-xs font-bold uppercase tracking-wide">{t('alertTitle')}</span>
          {ALERT.sample && <SampleTag />}
        </div>
        <p className="text-sm text-ink">{ALERT.text[lang]}</p>
      </Card>

      <section className="overflow-hidden rounded-lg bg-ink text-white">
        <div className="flex items-center justify-between gap-2 px-4 pt-3">
          <label className="flex items-center gap-1.5 text-xs text-white/70">
            <Icon.Pin width={14} height={14} />
            <select value={homeState} onChange={(e) => setHomeState(e.target.value)} aria-label={t('yourState')}
              className="rounded border border-white/25 bg-ink px-1.5 py-1 text-xs font-semibold text-white">
              {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </label>
          <NetworkBadge />
        </div>

        <div className="px-4 pt-3">
          <div className="text-[11px] uppercase tracking-[0.12em] text-white/55">{t('inYourState', { state: state?.name })}</div>
          {data ? (
            stateOpen > 0 ? (
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-2xl font-bold tabular-nums">{stateOpen}</span>
                <span className="text-sm text-white/80">{t('stOpen')}</span>
                {stateCritical > 0 && <span className="rounded bg-sos px-1.5 py-0.5 text-[11px] font-bold">{t('criticalCount', { n: stateCritical })}</span>}
              </div>
            ) : (
              <p className="mt-1 text-sm text-white/85">{t('allClearState')}</p>
            )
          ) : (
            <div className="mt-2 h-6 w-40 animate-pulse rounded bg-white/10" />
          )}
          {data?.totals.peopleWaiting > 0 && <p className="mt-0.5 text-[11px] text-white/55">{t('peopleWaiting', { n: data.totals.peopleWaiting })}</p>}
        </div>

        <div className="flex flex-col items-center px-4 pb-5 pt-5 text-center">
          <Link to="/sos" aria-label={t('sosHint')}
            className="sos-pulse flex h-40 w-40 items-center justify-center rounded-full bg-sos text-5xl font-black tracking-wider text-white ring-8 ring-white/10 active:bg-sos-dark">
            SOS
          </Link>
          <p className="mt-4 text-lg font-semibold">{t('sosHint')}</p>
          <p className="mt-1 max-w-xs text-xs text-white/65">{t('sosOfflineNote')}</p>
        </div>
      </section>

      <Link to="/map" className="block">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between bg-info-bg px-3 py-2.5">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Icon.Map width={18} height={18} className="text-info" /> {t('mapTitle')}
            </span>
            {data && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ok"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" /> Live</span>}
          </div>
          <div className="divide-y divide-line">
            {data && topAreas.length === 0 && <p className="px-3 py-2.5 text-xs text-ink-soft">{t('noReports')}</p>}
            {topAreas.map((d) => (
              <div key={d.district} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="truncate">{d.district} <span className="text-[11px] text-ink-soft">· {stateForDistrict(d.district)?.name}</span></span>
                <span className="flex shrink-0 gap-1 text-[11px] font-semibold">
                  {d.critical > 0 && <span className="rounded bg-sos px-1.5 py-0.5 text-white">{t('criticalCount', { n: d.critical })}</span>}
                  <span className="rounded bg-warn-bg px-1.5 py-0.5 text-warn">{t('openCount', { n: d.open })}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-1 px-3 py-2 text-xs font-semibold text-info">
            {t('viewMap')} <Icon.Chevron width={14} height={14} />
          </div>
        </Card>
      </Link>

      <Link to="/assistant" className="block">
        <Card className="flex items-center gap-3 border-info/40 bg-info-bg p-3">
          <span className="rounded-md bg-info p-2 text-white"><Icon.Chat /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">{t('askTitle')}</span>
            <span className="block text-xs text-ink-soft">{t('askHomeSub')}</span>
          </span>
          <Icon.Chevron className="text-info" />
        </Card>
      </Link>

      <section className="grid grid-cols-3 gap-2">
        <Tile to="/safety" icon="Shield" title={t('safety')} sub={t('safetySub')} tone="bg-ok-bg text-ok" />
        <Tile to="/shelters" icon="Tent" title={t('shelters')} sub={t('sheltersSub')} tone="bg-info-bg text-info" />
        <Tile to="/donate" icon="Heart" title={t('navDonate')} sub={t('donateHomeSub')} tone="bg-warn-bg text-warn" />
      </section>

      {records.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">{t('yourRequests')}</h2>
          <Card className="divide-y divide-line">
            {records.slice(0, 5).map((r) => (
              <Link key={r.clientRequestId} to={`/request/${r.clientRequestId}`} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="font-mono text-sm font-semibold">{r.reference ?? '—'}</div>
                  <div className="truncate text-xs text-ink-soft">{t(`cat_${r.payload.category}`)} · {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-1">
                  <DeliveryChip record={r} />
                  <Icon.Chevron width={16} height={16} className="text-ink-soft" />
                </div>
              </Link>
            ))}
          </Card>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">{t('helplines')}</h2>
        <Card className="grid grid-cols-2 divide-x divide-y divide-line">
          {HELPLINES.map((h) => (
            <a key={h.number} href={`tel:${h.number}`} className="flex flex-col gap-0.5 p-3">
              <span className="inline-flex items-center gap-1.5 font-mono text-xl font-bold text-sos">
                <Icon.Phone width={15} height={15} /> {h.number}
              </span>
              <span className="text-[11px] leading-tight text-ink-soft">{t(h.key)}</span>
            </a>
          ))}
        </Card>
      </section>
    </div>
  )
}
