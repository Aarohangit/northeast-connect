import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { flushOutbox, listRecords, onOutboxChange } from './outbox.js'

const SyncContext = createContext(null)

function connectionQuality() {
  if (!navigator.onLine) return 'offline'
  const type = navigator.connection?.effectiveType
  return type === 'slow-2g' || type === '2g' ? 'weak' : 'online'
}

async function requestBackgroundSync() {
  try {
    const reg = await navigator.serviceWorker?.ready
    await reg?.sync?.register('flush-outbox')
  } catch {
    // Not supported (iOS, Firefox). The in-page retry loop still covers it while the app is open.
  }
}

/**
 * Keeps the outbox moving while the app is open: retries with exponential
 * backoff, flushes the moment the browser reports a connection, and asks the
 * service worker to take over in the background when the app is closed.
 */
export function SyncProvider({ children }) {
  const [records, setRecords] = useState([])
  const [network, setNetwork] = useState(connectionQuality)
  const delay = useRef(2000)
  const timer = useRef(null)

  const refresh = useCallback(() => listRecords().then(setRecords), [])

  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    const remaining = await flushOutbox()
    await refresh()
    if (remaining > 0) {
      requestBackgroundSync()
      timer.current = setTimeout(flush, delay.current)
      delay.current = Math.min(delay.current * 2, 60_000)
    } else {
      delay.current = 2000
    }
  }, [refresh])

  useEffect(() => {
    refresh()
    flush()
    const unsub = onOutboxChange(refresh)
    const update = () => setNetwork(connectionQuality())
    const back = () => {
      update()
      delay.current = 2000
      flush()
    }
    window.addEventListener('online', back)
    window.addEventListener('offline', update)
    navigator.connection?.addEventListener?.('change', update)
    return () => {
      unsub()
      clearTimeout(timer.current)
      window.removeEventListener('online', back)
      window.removeEventListener('offline', update)
      navigator.connection?.removeEventListener?.('change', update)
    }
  }, [flush, refresh])

  return <SyncContext.Provider value={{ records, network, flush, refresh }}>{children}</SyncContext.Provider>
}

export function useSync() {
  return useContext(SyncContext)
}
