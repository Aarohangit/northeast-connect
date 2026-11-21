import { useCallback, useSyncExternalStore } from 'react'
import { STATES } from '../data/reference.js'
import { distanceKm, lastKnownPosition } from './geo.js'

const KEY = 'homeState'
const listeners = new Set()

/** Best guess when the person hasn't picked a state: the state whose centre is nearest their last fix. */
function guess() {
  const here = lastKnownPosition()
  if (!here) return 'AS'
  let best = STATES[0]
  for (const s of STATES) {
    const d = distanceKm(here, { latitude: s.center[0], longitude: s.center[1] })
    if (d < distanceKm(here, { latitude: best.center[0], longitude: best.center[1] })) best = s
  }
  return best.code
}

function read() {
  return localStorage.getItem(KEY) || guess()
}

export function useHomeState() {
  const code = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    read,
  )
  const set = useCallback((c) => {
    localStorage.setItem(KEY, c)
    listeners.forEach((l) => l())
  }, [])
  return [code, set]
}
