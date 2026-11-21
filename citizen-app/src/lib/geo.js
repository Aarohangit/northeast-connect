const LAST_POSITION = 'lastPosition'

/** Resolves to { latitude, longitude, accuracy } or rejects with 'denied' | 'unavailable' | 'timeout'. */
export function getPosition({ timeout = 20_000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('unavailable'))
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = {
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
          at: Date.now(),
        }
        localStorage.setItem(LAST_POSITION, JSON.stringify(p))
        resolve(p)
      },
      (err) => reject(new Error(err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable')),
      // GPS works without mobile data, so high accuracy is worth the wait.
      { enableHighAccuracy: true, timeout, maximumAge: 30_000 },
    )
  })
}

export function lastKnownPosition() {
  try {
    return JSON.parse(localStorage.getItem(LAST_POSITION))
  } catch {
    return null
  }
}

export function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLon = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
