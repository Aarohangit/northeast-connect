// Empty string = same origin (when the gateway serves the console); unset = local development.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8090'

let token = sessionStorage.getItem('token')
let onUnauthorized = () => {}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export function setToken(t) {
  token = t
  if (t) sessionStorage.setItem('token', t)
  else sessionStorage.removeItem('token')
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Cannot reach the server', 0)
  }
  if (res.status === 401 && token) {
    onUnauthorized()
    throw new ApiError('Your session has expired. Please sign in again.', 401)
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(data?.detail || `Request failed (${res.status})`, res.status)
  return data
}
