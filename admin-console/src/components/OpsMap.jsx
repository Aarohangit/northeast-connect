import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Fragment, useEffect, useMemo } from 'react'
import { Circle, CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { CATEGORY_LABEL, isOpen, severityMeta, STATUS_LABEL } from '../lib/format.js'
import { SeverityKey } from './Badges.jsx'

const ASSAM_BOUNDS = [[24.1, 89.7], [28.2, 96.1]]

const TEAM_COLOR = { AVAILABLE: '#1d6b3a', DEPLOYED: '#d35c00', OFF_DUTY: '#8b939d' }

function teamIcon(team) {
  const c = TEAM_COLOR[team.status]
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;gap:3px;transform:translate(-7px,-7px)">
      <div style="width:14px;height:14px;background:${c};border:2px solid #fff;box-shadow:0 0 0 1px ${c}"></div>
      <span style="font:600 10px/1 ui-monospace,Consolas,monospace;color:#12161c;background:rgba(255,255,255,.85);padding:1px 3px;white-space:nowrap">${team.code}</span>
    </div>`,
    iconSize: [0, 0],
  })
}

function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.latitude, target.longitude], Math.max(map.getZoom(), 12), { duration: 0.6 })
  }, [target?.reference]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-ink" />
      {label}
    </label>
  )
}

export default function OpsMap({ sos, teams, hotspots, selected, onSelect, layers, setLayers }) {
  const visible = useMemo(() => sos.filter((s) => layers.closed || isOpen(s.status)), [sos, layers.closed])
  const target = sos.find((s) => s.reference === selected)

  return (
    <section className="relative min-w-0 flex-1">
      <MapContainer bounds={ASSAM_BOUNDS} className="h-full w-full" zoomControl preferCanvas={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {layers.hotspots &&
          hotspots.map((h, i) => (
            <Circle
              key={`h${i}`}
              center={[h.center_latitude, h.center_longitude]}
              radius={Math.max(h.radius_km, 0.5) * 1000 + 400}
              pathOptions={{ color: '#c8102e', weight: 1.5, dashArray: '5 4', fillColor: '#c8102e', fillOpacity: 0.07 }}
            >
              <Tooltip direction="top" sticky>
                <strong>Hotspot:</strong> {h.report_count} reports, {h.critical_count} critical
              </Tooltip>
            </Circle>
          ))}

        {layers.teams &&
          teams.map((t) => (
            <Marker key={`t${t.id}`} position={[t.baseLatitude, t.baseLongitude]} icon={teamIcon(t)}>
              <Tooltip direction="top" offset={[0, -8]}>
                <strong>{t.code}</strong> · {t.name}
                <br />
                {t.status.toLowerCase().replace('_', ' ')} · {t.members} members · {t.boats} boats
              </Tooltip>
            </Marker>
          ))}

        {visible.map((s) => {
          const m = severityMeta(s)
          const open = isOpen(s.status)
          const isSel = s.reference === selected
          const people = s.triage?.peopleCount ?? s.peopleCount ?? 1
          const radius = Math.min(6 + Math.sqrt(people) * 2, 14)
          return (
            <Fragment key={s.reference}>
              {open && s.triage?.severity === 'CRITICAL' && (
                <CircleMarker center={[s.latitude, s.longitude]} radius={radius + 2} interactive={false}
                  pathOptions={{ color: m.color, fill: false, className: 'crit-pulse' }} />
              )}
              <CircleMarker
                center={[s.latitude, s.longitude]}
                radius={isSel ? radius + 3 : radius}
                eventHandlers={{ click: () => onSelect(s.reference) }}
                pathOptions={{
                  color: isSel ? '#12161c' : '#ffffff',
                  weight: isSel ? 3 : 1.5,
                  fillColor: m.color,
                  fillOpacity: open ? 0.92 : 0.35,
                }}
              >
                <Tooltip direction="top" offset={[0, -radius]}>
                  <strong>{s.reference}</strong> · {m.label}
                  <br />
                  {s.triage?.summary || CATEGORY_LABEL[s.category]}
                  <br />
                  <span style={{ color: '#5f6873' }}>{STATUS_LABEL[s.status]}</span>
                </Tooltip>
              </CircleMarker>
            </Fragment>
          )
        })}

        <FlyTo target={target} />
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[1000] space-y-2 rounded-sm border border-line bg-white/95 px-3 py-2 text-xs shadow-sm">
        <SeverityKey />
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
          {Object.entries(TEAM_COLOR).map(([k, c]) => (
            <span key={k} className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5" style={{ background: c }} /> Team {k.toLowerCase().replace('_', ' ')}
            </span>
          ))}
        </div>
        <div className="flex gap-3 border-t border-line-2 pt-2 text-[11px] text-ink-2">
          <Toggle label="Teams" checked={layers.teams} onChange={(v) => setLayers({ ...layers, teams: v })} />
          <Toggle label="Hotspots" checked={layers.hotspots} onChange={(v) => setLayers({ ...layers, hotspots: v })} />
          <Toggle label="Closed requests" checked={layers.closed} onChange={(v) => setLayers({ ...layers, closed: v })} />
        </div>
      </div>
    </section>
  )
}
