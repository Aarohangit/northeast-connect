import { API_URL } from './outbox.js'

async function request(path, options = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), options.timeout ?? 15_000)
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      signal: ctrl.signal,
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw Object.assign(new Error(data?.detail || `HTTP ${res.status}`), { status: res.status })
    return data
  } finally {
    clearTimeout(timer)
  }
}

export const fetchStatus = (reference) => request(`/api/sos/${encodeURIComponent(reference)}/status`)

export const updateLocation = (reference, body) =>
  request(`/api/sos/${encodeURIComponent(reference)}/location`, { method: 'PATCH', body: JSON.stringify(body) })
