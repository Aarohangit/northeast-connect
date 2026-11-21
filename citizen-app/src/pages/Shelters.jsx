import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, CircleMarker } from 'react-leaflet'
import { Card, PageTitle, SampleTag } from '../components/Layout.jsx'
import { Icon } from '../components/icons.jsx'
import { SHELTERS } from '../data/reference.js'
import { useLang } from '../i18n/index.jsx'
import { distanceKm, lastKnownPosition } from '../lib/geo.js'
import { useSync } from '../lib/sync.jsx'

// Plain square markers: no image assets to fetch, so they render offline too.
const shelterIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#1f5f99;border:3px solid #fff;box-shadow:0 0 0 1px #1f5f99"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const ASSAM_CENTER = [26.4, 92.8]

export default function Shelters() {
  const { t } = useLang()
  const { network } = useSync()
  const here = useMemo(() => lastKnownPosition(), [])

  const list = useMemo(() => {
    const withDist = SHELTERS.map((s) => ({ ...s, km: here ? distanceKm(here, s) : null }))
    return here ? withDist.sort((a, b) => a.km - b.km) : withDist
  }, [here])

  return (
    <div className="space-y-4">
      <PageTitle>
        <span className="inline-flex items-center gap-2">{t('sheltersTitle')} <SampleTag /></span>
      </PageTitle>

      {network === 'offline' ? (
        <Card className="p-3 text-sm text-ink-soft">{t('mapOffline')}</Card>
      ) : (
        <Card className="overflow-hidden">
          <MapContainer center={here ? [here.latitude, here.longitude] : ASSAM_CENTER} zoom={here ? 10 : 7} className="h-64 w-full" scrollWheelZoom={false}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {here && <CircleMarker center={[here.latitude, here.longitude]} radius={8} pathOptions={{ color: '#c8102e', fillOpacity: 0.9 }} />}
            {list.map((s) => (
              <Marker key={s.id} position={[s.latitude, s.longitude]} icon={shelterIcon}>
                <Popup>
                  <strong>{s.name}</strong>
                  <br />
                  {t('capacity', { n: s.capacity })}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Card>
      )}

      {here && <p className="text-xs text-ink-soft">{t('sortedByDistance')}</p>}

      <Card className="divide-y divide-line">
        {list.map((s) => (
          <div key={s.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-ink-soft">
                  {s.district} · {t('capacity', { n: s.capacity })}
                  {s.km != null && <> · <span className="font-semibold text-ink">{t('kmAway', { km: s.km.toFixed(1) })}</span></>}
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded border border-info px-2 py-1 text-xs font-semibold text-info"
              >
                <Icon.Pin width={14} height={14} /> {t('directions')}
              </a>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {s.facilities.map((f) => (
                <span key={f} className="rounded bg-info-bg px-1.5 py-0.5 text-[11px] font-medium text-info">{t(`fac_${f}`)}</span>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
