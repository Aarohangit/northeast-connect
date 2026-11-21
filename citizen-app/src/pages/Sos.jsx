import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Card, PageTitle } from '../components/Layout.jsx'
import { CATEGORY_ICON, Icon } from '../components/icons.jsx'
import { STATES } from '../data/reference.js'
import { SPEECH_LOCALE, useLang } from '../i18n/index.jsx'
import { getPosition } from '../lib/geo.js'
import { isValidMobile, normalisePhone } from '../lib/phone.js'
import { enqueue } from '../lib/outbox.js'
import { useSync } from '../lib/sync.jsx'
import { useHomeState } from '../lib/region.js'

const CATEGORIES = ['TRAPPED_IN_WATER', 'LANDSLIDE', 'EARTHQUAKE', 'MEDICAL', 'FOOD_AND_WATER', 'VULNERABLE_PERSON', 'CHILDREN', 'OTHER']
const PROFILE = 'sosProfile'

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE)) ?? {}
  } catch {
    return {}
  }
}


function LocationBlock({ state, onRetry }) {
  const { t } = useLang()
  if (state.status === 'locating') {
    return (
      <div className="flex items-center gap-3 text-sm text-ink-soft">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-soft border-t-transparent" />
        {t('locating')}
      </div>
    )
  }
  if (state.status === 'ok') {
    const { latitude, longitude, accuracy } = state.position
    return (
      <div className="text-sm">
        <div className="flex items-center gap-2 font-semibold text-ok">
          <Icon.Check width={16} height={16} />
          <span className="font-mono">{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
        </div>
        <div className={accuracy > 100 ? 'mt-1 text-warn' : 'mt-1 text-ink-soft'}>
          {accuracy > 100 ? t('locWeak', { m: accuracy }) : t('locAccuracy', { m: accuracy })}
        </div>
        <button type="button" onClick={onRetry} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-info">
          <Icon.Refresh width={14} height={14} /> {t('retry')}
        </button>
      </div>
    )
  }
  return (
    <div className="text-sm">
      <p className="text-sos">{state.status === 'denied' ? t('locDenied') : t('locFailed')}</p>
      <button type="button" onClick={onRetry} className="mt-2 rounded border border-ink px-3 py-1.5 text-sm font-semibold">
        {t('retry')}
      </button>
    </div>
  )
}

function useDictation(lang, onText) {
  const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  const [listening, setListening] = useState(false)
  const rec = useRef(null)

  const toggle = () => {
    if (listening) {
      rec.current?.stop()
      return
    }
    const r = new Recognition()
    r.lang = SPEECH_LOCALE[lang]
    r.interimResults = false
    r.onresult = (e) => onText(Array.from(e.results).map((x) => x[0].transcript).join(' '))
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    rec.current = r
    setListening(true)
    r.start()
  }

  return { supported: Boolean(Recognition) && navigator.onLine, listening, toggle }
}

export default function Sos() {
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const { flush } = useSync()
  const [homeState] = useHomeState()
  // Their own state's districts first, then the rest of the North East.
  const groups = [...STATES].sort((a, b) => (a.code === homeState ? -1 : b.code === homeState ? 1 : a.name.localeCompare(b.name)))
  const profile = loadProfile()

  const [loc, setLoc] = useState({ status: 'locating' })
  const [category, setCategory] = useState(null)
  const [people, setPeople] = useState(1)
  const [name, setName] = useState(profile.name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [district, setDistrict] = useState(profile.district ?? '')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const locate = () => {
    setLoc({ status: 'locating' })
    getPosition()
      .then((position) => setLoc({ status: 'ok', position }))
      .catch((e) => setLoc({ status: e.message }))
  }
  useEffect(locate, [])

  const dictation = useDictation(lang, (text) => setDescription((d) => (d ? `${d} ${text}` : text)))

  const submit = async (e) => {
    e.preventDefault()
    const phoneDigits = normalisePhone(phone)
    const errs = {}
    if (loc.status !== 'ok') errs.location = t('needLocation')
    if (!category) errs.category = t('pickCategory')
    if (!name.trim()) errs.name = t('required')
    if (!isValidMobile(phone)) errs.phone = t('phoneInvalid')
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    localStorage.setItem(PROFILE, JSON.stringify({ name: name.trim(), phone: phoneDigits, district }))
    // Saved to the phone first. Sending happens in the background and can't lose it.
    const record = await enqueue({
      name: name.trim(),
      phone: phoneDigits,
      category,
      peopleCount: people,
      description: description.trim() || null,
      latitude: loc.position.latitude,
      longitude: loc.position.longitude,
      accuracyMeters: loc.position.accuracy,
      district: district || null,
      language: lang,
    })
    flush()
    navigate(`/request/${record.clientRequestId}`, { replace: true })
  }

  const fieldClass = 'w-full rounded border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-ink'

  return (
    <form onSubmit={submit} noValidate className="space-y-4 pb-24">
      <PageTitle>{t('sosTitle')}</PageTitle>

      <Card className="p-3" data-error={Boolean(errors.location)}>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
          <Icon.Pin width={14} height={14} /> {t('location')}
        </div>
        <LocationBlock state={loc} onRetry={locate} />
        {errors.location && <p className="mt-2 text-sm font-semibold text-sos">{errors.location}</p>}
      </Card>

      <fieldset data-error={Boolean(errors.category)}>
        <legend className="mb-2 font-semibold">{t('whatHappened')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => {
            const Glyph = CATEGORY_ICON[c]
            const active = category === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={`flex min-h-20 flex-col items-start justify-between gap-2 rounded-md border p-3 text-left text-sm font-semibold ${
                  active ? 'border-sos bg-sos text-white' : 'border-line bg-white'
                }`}
              >
                <Glyph />
                {t(`cat_${c}`)}
              </button>
            )
          })}
        </div>
        {errors.category && <p className="mt-2 text-sm font-semibold text-sos">{errors.category}</p>}
      </fieldset>

      <div>
        <label className="mb-2 block font-semibold">{t('people')}</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setPeople((n) => Math.max(1, n - 1))} className="rounded border border-line bg-white p-3" aria-label="-">
            <Icon.Minus />
          </button>
          <output className="w-12 text-center text-2xl font-bold tabular-nums">{people}</output>
          <button type="button" onClick={() => setPeople((n) => Math.min(500, n + 1))} className="rounded border border-line bg-white p-3" aria-label="+">
            <Icon.Plus />
          </button>
        </div>
      </div>

      <div data-error={Boolean(errors.name)}>
        <label htmlFor="name" className="mb-1 block font-semibold">{t('name')}</label>
        <input id="name" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
        {errors.name && <p className="mt-1 text-sm font-semibold text-sos">{errors.name}</p>}
      </div>

      <div data-error={Boolean(errors.phone)}>
        <label htmlFor="phone" className="mb-1 block font-semibold">{t('phone')}</label>
        <input id="phone" className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" maxLength={16} />
        <p className="mt-1 text-xs text-ink-soft">{t('phoneHint')}</p>
        {errors.phone && <p className="mt-1 text-sm font-semibold text-sos">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="district" className="mb-1 block font-semibold">{t('district')}</label>
        <select id="district" className={fieldClass} value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">{t('districtUnknown')}</option>
          {groups.map((st) => (
            <optgroup key={st.code} label={st.name}>
              {st.districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1 flex items-end justify-between">
          <label htmlFor="details" className="font-semibold">{t('details')}</label>
          {dictation.supported && (
            <button
              type="button"
              onClick={dictation.toggle}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${dictation.listening ? 'bg-sos text-white' : 'border border-line bg-white'}`}
            >
              <Icon.Mic width={14} height={14} /> {dictation.listening ? t('listening') : t('speak')}
            </button>
          )}
        </div>
        <textarea id="details" rows={4} className={fieldClass} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
        <p className="mt-1 text-xs text-ink-soft">{t('detailsHint')}</p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[1000] border-t border-line bg-paper/95 p-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-sos py-4 text-lg font-bold text-white active:bg-sos-dark disabled:opacity-60"
          >
            {t('send')}
          </button>
        </div>
      </div>
    </form>
  )
}
