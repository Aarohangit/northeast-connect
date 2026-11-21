import { useEffect, useState } from 'react'
import { API_URL } from './outbox.js'

const CACHE = 'situationCache'
const POLL_MS = 15_000

function cached() {
  try {
    return JSON.parse(localStorage.getItem(CACHE))
  } catch {
    return null
  }
}

/**
 * The public situation (rounded SOS locations and counts), refreshed every 15 seconds.
 * The last good copy is kept on the phone so the map still shows something offline.
 */
export function useSituation() {
  const [state, setState] = useState(() => {
    const c = cached()
    return { data: c?.data ?? null, fetchedAt: c?.fetchedAt ?? null, live: false }
  })

  useEffect(() => {
    let stop = false
    const load = async () => {
      if (!navigator.onLine) return setState((s) => ({ ...s, live: false }))
      try {
        const res = await fetch(`${API_URL}/api/public/situation`)
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        const fetchedAt = Date.now()
        localStorage.setItem(CACHE, JSON.stringify({ data, fetchedAt }))
        if (!stop) setState({ data, fetchedAt, live: true })
      } catch {
        if (!stop) setState((s) => ({ ...s, live: false }))
      }
    }
    load()
    const id = setInterval(load, POLL_MS)
    window.addEventListener('online', load)
    return () => {
      stop = true
      clearInterval(id)
      window.removeEventListener('online', load)
    }
  }, [])

  return state
}

export const SEVERITY_COLOR = { CRITICAL: '#c8102e', HIGH: '#d35c00', MEDIUM: '#a37b00', LOW: '#3c6e9e', PENDING: '#6b7280' }
export const HAZARD_OF = { TRAPPED_IN_WATER: 'flood', LANDSLIDE: 'landslide', EARTHQUAKE: 'earthquake' }
