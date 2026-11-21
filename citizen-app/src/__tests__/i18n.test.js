import { describe, expect, it } from 'vitest'
import { strings } from '../i18n/strings.js'

describe('translations', () => {
  const en = Object.keys(strings.en).sort()

  it.each(['as', 'hi'])('%s has every English key, so no screen shows a missing label', (lang) => {
    expect(Object.keys(strings[lang]).sort()).toEqual(en)
  })

  it.each(['as', 'hi', 'en'])('%s has no empty strings', (lang) => {
    expect(Object.values(strings[lang]).every((v) => typeof v === 'string' && v.trim().length > 0)).toBe(true)
  })
})
