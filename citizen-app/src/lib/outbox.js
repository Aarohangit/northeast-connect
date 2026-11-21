/*
 * The SOS outbox. Every request is written here first, before any network
 * call, so pressing "Send" can never lose it. Both the page and the service
 * worker drain it; the server de-duplicates on clientRequestId, so a request
 * sent twice is still recorded once.
 *
 * States:
 *   queued    - on the phone, not yet acknowledged by the server
 *   sending   - a send is in flight right now
 *   delivered - the server acknowledged it and returned a reference
 *   failed    - the server refused it (bad data); retrying won't help
 */
import { openDB } from 'idb'

// Empty string = same origin (when the gateway serves the app); unset = local development.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8090'

const DB_NAME = 'flood-citizen'
const STORE = 'outbox'
const SEND_TIMEOUT_MS = 20_000
const STUCK_SENDING_MS = 60_000

let dbPromise
function db() {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(d) {
      d.createObjectStore(STORE, { keyPath: 'clientRequestId' })
    },
  })
  return dbPromise
}

// BroadcastChannel carries changes between the page and the service worker, but it never
// delivers a message back to the sender, so listeners in the same context are called directly.
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('outbox') : null
const localListeners = new Set()

function changed(id) {
  const msg = { type: 'changed', id }
  channel?.postMessage(msg)
  localListeners.forEach((fn) => fn(msg))
}

export function onOutboxChange(fn) {
  localListeners.add(fn)
  const remote = (e) => fn(e.data)
  channel?.addEventListener('message', remote)
  return () => {
    localListeners.delete(fn)
    channel?.removeEventListener('message', remote)
  }
}

function newId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  // Older browsers and non-HTTPS origins don't have randomUUID.
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export async function enqueue(payload) {
  const record = {
    clientRequestId: newId(),
    payload: { ...payload, reportedAt: new Date().toISOString() },
    state: 'queued',
    createdAt: Date.now(),
    createdOffline: !navigator.onLine,
    attempts: 0,
    lastAttemptAt: null,
    lastError: null,
    reference: null,
    deliveredAt: null,
    lastStatus: null,
  }
  await (await db()).put(STORE, record)
  changed(record.clientRequestId)
  return record
}

export async function getRecord(id) {
  return (await db()).get(STORE, id)
}

export async function listRecords() {
  const all = await (await db()).getAll(STORE)
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function patchRecord(id, patch) {
  const d = await db()
  const tx = d.transaction(STORE, 'readwrite')
  const current = await tx.store.get(id)
  if (!current) return null
  const next = { ...current, ...patch }
  await tx.store.put(next)
  await tx.done
  changed(id)
  return next
}

function isPending(r) {
  if (r.state === 'queued') return true
  // A send that was cut off (tab closed, phone slept) is retried after a minute.
  return r.state === 'sending' && Date.now() - (r.lastAttemptAt ?? 0) > STUCK_SENDING_MS
}

export async function pendingCount() {
  return (await listRecords()).filter((r) => r.state !== 'delivered' && r.state !== 'failed').length
}

async function sendOne(record) {
  await patchRecord(record.clientRequestId, {
    state: 'sending',
    attempts: record.attempts + 1,
    lastAttemptAt: Date.now(),
  })

  // If the phone had to hold on to it, tell the control room it arrived late.
  const channelName = record.createdOffline || record.attempts > 0 ? 'QUEUED_SYNC' : 'DIRECT'
  const body = JSON.stringify({ ...record.payload, clientRequestId: record.clientRequestId, channel: channelName })

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), SEND_TIMEOUT_MS)
  try {
    const res = await fetch(`${API_URL}/api/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: ctrl.signal,
    })
    if (res.ok) {
      const data = await res.json()
      await patchRecord(record.clientRequestId, {
        state: 'delivered',
        reference: data.reference,
        deliveredAt: Date.now(),
        lastStatus: data,
        lastError: null,
      })
      return true
    }
    const problem = await res.json().catch(() => ({}))
    const retryable = res.status === 408 || res.status === 429 || res.status >= 500
    await patchRecord(record.clientRequestId, {
      state: retryable ? 'queued' : 'failed',
      lastError: problem.detail || `HTTP ${res.status}`,
    })
    return false
  } catch (e) {
    await patchRecord(record.clientRequestId, {
      state: 'queued',
      lastError: e.name === 'AbortError' ? 'timeout' : 'network',
    })
    return false
  } finally {
    clearTimeout(timer)
  }
}

let flushing = null

/** Tries to send everything still pending. Returns how many are still waiting. */
export function flushOutbox() {
  flushing ??= (async () => {
    try {
      const pending = (await listRecords()).filter(isPending).reverse() // oldest first
      for (const r of pending) {
        const ok = await sendOne(r)
        if (!ok && !navigator.onLine) break
      }
      return pendingCount()
    } finally {
      flushing = null
    }
  })()
  return flushing
}
