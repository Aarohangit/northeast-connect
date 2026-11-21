import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet'
import { Card } from '../components/Layout.jsx'
import { NE_CENTER, SHELTERS, stateForDistrict, stateOf } from '../data/reference.js'
import { useLang } from '../i18n/index.jsx'
import { useHomeState } from '../lib/region.js'
import { HAZARD_OF, SEVERITY_COLOR, useSituation } from '../lib/situation.js'

const shelterIcon = L.divIcon({
  className: '',
  html: '<div style="width:13px;height:13px;background:#1f5f99;border:2px solid #fff;box-shadow:0 0 0 1px #1f5f99"></div>',
  iconSize: [13, 13],
  iconAnchor: [6, 6],
})

const FILTERS = ['all', 'flood', 'landslide', 'earthquake']

function useSecondsSince(ts) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return ts ? Math.max(0, Math.round((now - ts) / 1000)) : null
}

function Stat({ value, label, tone }) {
  return (
    <div className="flex-1 px-2 py-2 text-center">
      <div className={`text-xl font-bold tabular-nums ${tone}`}>{value ?? '–'}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">{label}</div>
    </div>
  )
}

export default function LiveMap() {
  const { t } = useLang()
  const { data, fetchedAt, live } = useSituation()
  const [homeState] = useHomeState()
  const [filter, setFilter] = useState('all')
  const seconds = useSecondsSince(fetchedAt)

  const points = useMemo(
    () => (data?.points ?? []).filter((p) => filter === 'all' || HAZARD_OF[p.category] === filter),
    [data, filter],
  )
  const center = stateOf(homeState)?.center ?? NE_CENTER

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t('mapTitle')}</h1>
        <p className="text-xs text-ink-soft">{t('mapSub')}</p>
      </div>

      <div className="flex items-center justify-between">
        {live ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ok">
            <span className="h-2 w-2 animate-pulse rounded-full bg-ok" /> {t('liveUpdated', { s: seconds ?? 0 })}
          </span>
        ) : (
          <span className="text-xs font-semibold text-warn">
            {fetchedAt ? t('mapCached', { t: new Date(fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }) : t('offline')}
          </span>
        )}
        <div className="flex gap-1" role="tablist">
          {FILTERS.map((f) => (
            <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${filter === f ? 'bg-ink text-white' : 'border border-line bg-white text-ink-soft'}`}>
              {f === 'all' ? t('hzAll') : t(`hz_${f}`)}
            </button>
          ))}
        </div>
      </div>

      <Card className="flex divide-x divide-line">
        <Stat value={data?.totals.open} label={t('stOpen')} tone="text-ink" />
        <Stat value={data?.totals.critical} label={t('stCritical')} tone="text-sos" />
        <Stat value={data?.totals.rescued} label={t('stRescued')} tone="text-ok" />
        <Stat value={data?.totals.districtsAffected} label={t('stDistricts')} tone="text-info" />
      </Card>

      <Card className="relative overflow-hidden">
        <MapContainer center={center} zoom={7} className="h-[420px] w-full" scrollWheelZoom>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {SHELTERS.map((s) => (
            <Marker key={`s${s.id}`} position={[s.latitude, s.longitude]} icon={shelterIcon}>
              <Tooltip>{s.name}</Tooltip>
            </Marker>
          ))}
          {points.map((p, i) => {
            const rescued = p.status === 'RESCUED'
            const color = rescued ? '#1d6b3a' : SEVERITY_COLOR[p.severity] ?? SEVERITY_COLOR.PENDING
            return (
              <Fragment key={i}>
                {!rescued && (
                  <CircleMarker center={[p.latitude, p.longitude]} radius={16} interactive={false}
                    pathOptions={{ stroke: false, fillColor: color, fillOpacity: 0.16 }} />
                )}
                <CircleMarker center={[p.latitude, p.longitude]} radius={rescued ? 5 : 7}
                  pathOptions={{ color: '#fff', weight: 1.5, fillColor: color, fillOpacity: rescued ? 0.6 : 0.95,
                    className: p.severity === 'CRITICAL' && !rescued ? 'crit-dot' : undefined }}>
                  <Tooltip>
                    <strong>{t(`cat_${p.category}`)}</strong><br />
                    {p.status === 'HELP_ON_THE_WAY' ? t('lgOnTheWay') : rescued ? t('stRescued') : t('lgHelpRequested')}
                    {' · '}{p.district ?? ''} · {t('minutesAgo', { n: p.minutesAgo })}
                  </Tooltip>
                </CircleMarker>
              </Fragment>
            )
          })}
        </MapContainer>
        <div className="pointer-events-none absolute bottom-2 left-2 z-[500] space-y-0.5 rounded bg-white/95 px-2 py-1.5 text-[10px] shadow">
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_COLOR.CRITICAL }} /> {t('stCritical')}</div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_COLOR.HIGH }} /> {t('lgHelpRequested')}</div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ok" /> {t('stRescued')}</div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-info" /> {t('lgShelter')}</div>
        </div>
      </Card>
      <p className="text-[11px] text-ink-soft">{t('lgClear')}</p>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">{t('affectedAreas')}</h2>
        {!data?.districts.length ? (
          <Card className="p-3 text-sm text-ink-soft">{t('noReports')}</Card>
        ) : (
          <Card className="divide-y divide-line">
            {data.districts.map((d) => (
              <div key={d.district} className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{d.district}</div>
                  <div className="text-[11px] text-ink-soft">
                    {stateForDistrict(d.district)?.name ?? ''}{d.mainHazard !== 'OTHER' ? ` · ${t(`hz_${d.mainHazard.toLowerCase()}`)}` : ''}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 text-[11px] font-semibold">
                  {d.critical > 0 && <span className="rounded bg-sos px-1.5 py-0.5 text-white">{t('criticalCount', { n: d.critical })}</span>}
                  {d.open > 0 && <span className="rounded bg-warn-bg px-1.5 py-0.5 text-warn">{t('openCount', { n: d.open })}</span>}
                  {d.rescued > 0 && <span className="rounded bg-ok-bg px-1.5 py-0.5 text-ok">{t('rescuedCount', { n: d.rescued })}</span>}
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  )
}
