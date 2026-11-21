import { useMemo, useState } from 'react'
import Detail from '../components/Detail.jsx'
import Kpis from '../components/Kpis.jsx'
import OpsMap from '../components/OpsMap.jsx'
import Queue, { TABS } from '../components/Queue.jsx'
import { useAuth } from '../lib/auth.jsx'
import { useData } from '../lib/data.jsx'

export default function Command() {
  const { user } = useAuth()
  const { sos, teams, all, hotspots, loaded } = useData()
  const [tab, setTab] = useState('review')
  const [district, setDistrict] = useState(user.district ?? '')
  const [selected, setSelected] = useState(null)
  const [layers, setLayers] = useState({ teams: true, hotspots: true, closed: false })

  const districts = useMemo(
    () => [...new Set([...sos.map((s) => s.district), ...teams.map((t) => t.district)].filter(Boolean))].sort(),
    [sos, teams],
  )
  const scoped = useMemo(() => sos.filter((s) => !district || s.district === district), [sos, district])
  const current = sos.find((s) => s.reference === selected)

  // Picking a request on the map should also show it in the right queue tab.
  const select = (ref) => {
    setSelected(ref)
    const s = sos.find((x) => x.reference === ref)
    const t = s && TABS.find((x) => x.match(s))
    if (t) setTab(t.id)
    if (s && district && s.district !== district) setDistrict('')
  }

  if (!loaded) return <div className="flex flex-1 items-center justify-center text-muted">Loading live data…</div>

  return (
    <>
      <Kpis sos={scoped} teams={teams} all={all} />
      <div className="flex min-h-0 flex-1">
        <Queue sos={sos} tab={tab} setTab={setTab} district={district} setDistrict={setDistrict}
          districts={districts} selected={selected} onSelect={select} />
        <OpsMap sos={scoped} teams={teams} hotspots={hotspots} selected={selected} onSelect={select}
          layers={layers} setLayers={setLayers} />
        {current && <Detail key={current.reference} sos={current} onClose={() => setSelected(null)} onSelect={select} />}
      </div>
    </>
  )
}
