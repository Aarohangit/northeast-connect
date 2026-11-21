import { describe, expect, it } from 'vitest'
import { distanceKm } from '../lib/geo.js'
import { isValidMobile, normalisePhone } from '../lib/phone.js'

describe('phone numbers as people type them', () => {
  it.each([
    ['+91 98640 12345', '9864012345'],
    ['09864012345', '9864012345'],
    ['98640-12345', '9864012345'],
  ])('%s -> %s', (raw, expected) => expect(normalisePhone(raw)).toBe(expected))

  it('rejects numbers that cannot be Indian mobiles', () => {
    expect(isValidMobile('12345')).toBe(false)
    expect(isValidMobile('1234567890')).toBe(false)
    expect(isValidMobile('+91 98640 12345')).toBe(true)
  })
})

describe('distance', () => {
  it('Guwahati to Shillong is about 64 km in a straight line', () => {
    expect(distanceKm({ latitude: 26.1445, longitude: 91.7362 }, { latitude: 25.5788, longitude: 91.8933 })).toBeGreaterThan(62)
  })
})
