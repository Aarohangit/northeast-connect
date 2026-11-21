import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api } from './api.js'
import { isOpen, severityOf } from './format.js'

const DataContext = createContext(null)
const POLL_MS = 4000

/**
 * One poll loop for the whole console, so every panel shows the same moment in time.
 * If a poll fails, the last good data stays on screen with a visible warning.
 */
export function DataProvider({ children }) {
  const [state, setState] = useState({ sos: [], teams: [], open: [], all: [], hotspots: [], loaded: false })
  const [lastOk, setLastOk] = useState(null)
  const [error, setError] = useState(null)
  const busy = useRef(false)
  const known = useRef(null)
  const [incoming, setIncoming] = useState([])

  const refresh = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    try {
      const [sos, teams, open, all] = await Promise.all([
        api('/api/sos'),
        api('/api/teams'),
        api('/api/assignments?open=true'),
        api('/api/assignments'),
      ])
      const points = sos
        .filter((s) => isOpen(s.status))
        .map((s) => ({ reference: s.reference, latitude: s.latitude, longitude: s.longitude, severity: severityOf(s) ?? 'HIGH' }))
      let hotspots = []
      if (points.length >= 3) {
        hotspots = (await api('/api/ai/hotspots', { method: 'POST', body: { points, radius_km: 1.5, min_reports: 3 } }).catch(() => ({ hotspots: [] }))).hotspots
      }
      // Anything we haven't seen before (after the first load) is a new SOS: announce it.
      if (known.current) {
        const fresh = sos.filter((s) => !known.current.has(s.reference))
        if (fresh.length) setIncoming((list) => [...fresh.map((s) => ({ ...s, arrivedAt: Date.now() })), ...list].slice(0, 5))
      }
      known.current = new Set(sos.map((s) => s.reference))
      setState({ sos, teams, open, all, hotspots, loaded: true })
      setLastOk(Date.now())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      busy.current = false
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  const dismiss = useCallback((ref) => setIncoming((list) => list.filter((s) => s.reference !== ref)), [])

  return <DataContext.Provider value={{ ...state, lastOk, error, refresh, incoming, dismiss }}>{children}</DataContext.Provider>
}

export function useData() {
  return useContext(DataContext)
}

/** Re-render every `ms` so relative times ("4 min ago") stay current. */
export function useTick(ms = 30_000) {
  const [, set] = useState(0)
  useEffect(() => {
    const id = setInterval(() => set((n) => n + 1), ms)
    return () => clearInterval(id)
  }, [ms])
}
