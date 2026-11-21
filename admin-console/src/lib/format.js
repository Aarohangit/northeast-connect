export const SEVERITY = {
  CRITICAL: { label: 'Critical', color: '#c8102e', text: 'text-crit', bg: 'bg-crit-bg', rank: 0 },
  HIGH: { label: 'High', color: '#d35c00', text: 'text-high', bg: 'bg-high-bg', rank: 1 },
  PENDING: { label: 'Triage pending', color: '#6b7280', text: 'text-pend', bg: 'bg-pend-bg', rank: 1.5 },
  MEDIUM: { label: 'Medium', color: '#9a7400', text: 'text-med', bg: 'bg-med-bg', rank: 2 },
  LOW: { label: 'Low', color: '#3c6e9e', text: 'text-low', bg: 'bg-low-bg', rank: 3 },
}

export const STATUS_LABEL = {
  RECEIVED: 'Awaiting review',
  VERIFIED: 'Verified · awaiting dispatch',
  TEAM_ASSIGNED: 'Team assigned',
  IN_PROGRESS: 'Team en route',
  RESCUED: 'Rescued',
  REJECTED: 'Rejected',
  DUPLICATE: 'Duplicate',
}

export const CATEGORY_LABEL = {
  TRAPPED_IN_WATER: 'Trapped in water',
  MEDICAL: 'Medical',
  FOOD_AND_WATER: 'Food / water',
  VULNERABLE_PERSON: 'Vulnerable person',
  CHILDREN: 'Children',
  OTHER: 'Other',
}

export const TEAM_TYPE_LABEL = {
  NDRF: 'NDRF',
  SDRF: 'SDRF',
  FIRE_AND_EMERGENCY: 'Fire & Emergency',
  MEDICAL: 'Medical',
  CIVIL_DEFENCE: 'Civil Defence',
  VOLUNTEER: 'Volunteers',
}

const CLOSED = new Set(['RESCUED', 'REJECTED', 'DUPLICATE'])
export const isOpen = (status) => !CLOSED.has(status)

/** AI suggestion if available, otherwise null while triage is still running. */
export const severityOf = (sos) => sos.triage?.severity ?? null
export const severityMeta = (sos) => SEVERITY[severityOf(sos) ?? 'PENDING']

export function bySeverityThenAge(a, b) {
  const r = severityMeta(a).rank - severityMeta(b).rank
  return r !== 0 ? r : new Date(a.receivedAt) - new Date(b.receivedAt)
}

export function ago(ts) {
  const s = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min ago`
  return `${Math.floor(s / 86400)} d ago`
}

export const clock = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export const humanize = (s) => s.toLowerCase().replace(/_/g, ' ')

export const LANGUAGE_LABEL = { as: 'Assamese', hi: 'Hindi', en: 'English', bn: 'Bengali' }

export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`
