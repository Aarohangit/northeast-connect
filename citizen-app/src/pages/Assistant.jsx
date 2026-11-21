import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { PageTitle } from '../components/Layout.jsx'
import { Icon } from '../components/icons.jsx'
import { ALERT } from '../data/reference.js'
import { SPEECH_LOCALE, useLang } from '../i18n/index.jsx'
import { askAssistant } from '../lib/api.js'
import { lastKnownPosition } from '../lib/geo.js'
import { useHomeState } from '../lib/region.js'
import { useSync } from '../lib/sync.jsx'

const STORE = 'assistantChat'

const ACTION_TARGET = {
  OPEN_SOS: { to: '/sos', tone: 'sos' },
  CALL_112: { href: 'tel:112', tone: 'sos' },
  CALL_108: { href: 'tel:108', tone: 'plain' },
  SHOW_SHELTERS: { to: '/shelters', tone: 'plain' },
  GUIDE_FLOOD: { to: '/safety?hazard=flood', tone: 'plain' },
  GUIDE_LANDSLIDE: { to: '/safety?hazard=landslide', tone: 'plain' },
  GUIDE_EARTHQUAKE: { to: '/safety?hazard=earthquake', tone: 'plain' },
}

function ActionButton({ action }) {
  const { t } = useLang()
  const target = ACTION_TARGET[action]
  if (!target) return null
  const cls = `inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-semibold ${
    target.tone === 'sos' ? 'bg-sos text-white' : 'border border-ink/20 bg-white text-ink'
  }`
  const label = t(`act_${action}`)
  return target.href ? <a href={target.href} className={cls}>{label}</a> : <Link to={target.to} className={cls}>{label}</Link>
}

function useSpeech(lang) {
  const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  const [listening, setListening] = useState(false)
  const rec = useRef(null)
  const listen = (onText) => {
    if (listening) return rec.current?.stop()
    const r = new Recognition()
    r.lang = SPEECH_LOCALE[lang]
    r.onresult = (e) => onText(Array.from(e.results).map((x) => x[0].transcript).join(' '))
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    rec.current = r
    setListening(true)
    r.start()
  }
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window
  const speak = (text) => {
    if (!canSpeak) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = SPEECH_LOCALE[lang]
    window.speechSynthesis.speak(u)
  }
  return { canListen: Boolean(Recognition), listening, listen, canSpeak, speak }
}

export default function Assistant() {
  const { t, lang } = useLang()
  const { network } = useSync()
  const [homeState] = useHomeState()
  const navigate = useNavigate()
  const [chat, setChat] = useState(() => JSON.parse(sessionStorage.getItem(STORE) || '[]'))
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [readAloud, setReadAloud] = useState(false)
  const speech = useSpeech(lang)
  const endRef = useRef(null)

  useEffect(() => {
    sessionStorage.setItem(STORE, JSON.stringify(chat))
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chat, busy])

  const send = async (text) => {
    const question = text.trim()
    if (!question || busy) return
    setInput('')
    setNotice(null)
    if (!navigator.onLine) {
      setNotice('askOffline')
      return
    }
    const next = [...chat, { role: 'user', content: question }]
    setChat(next)
    setBusy(true)
    const here = lastKnownPosition()
    try {
      const r = await askAssistant({
        messages: next.slice(-10).map(({ role, content }) => ({ role, content })),
        language: lang,
        state: homeState,
        latitude: here?.latitude ?? null,
        longitude: here?.longitude ?? null,
        alerts: [ALERT.text.en],
      })
      setChat([...next, { role: 'assistant', content: r.reply, emergency: r.emergency, actions: r.actions, followUps: r.follow_ups, engine: r.engine }])
      if (readAloud) speech.speak(r.reply)
    } catch {
      setNotice('askError')
    } finally {
      setBusy(false)
    }
  }

  const last = chat[chat.length - 1]
  const suggestions = last?.role === 'assistant' && last.followUps?.length ? last.followUps : chat.length === 0 ? [t('sug1'), t('sug2'), t('sug3')] : []

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <PageTitle>{t('askTitle')}</PageTitle>
      <div className="-mt-3 mb-3 flex items-center justify-between gap-2 text-xs text-ink-soft">
        <span>{t('askSub')}</span>
        <div className="flex items-center gap-2">
          {speech.canSpeak && (
            <button type="button" onClick={() => setReadAloud((v) => !v)} aria-pressed={readAloud} title={t('readAloud')}
              className={`rounded p-1.5 ${readAloud ? 'bg-ink text-white' : 'border border-line bg-white'}`}>
              <Icon.Speaker width={16} height={16} />
              <span className="sr-only">{t('readAloud')}</span>
            </button>
          )}
          {chat.length > 0 && (
            <button type="button" onClick={() => { setChat([]); setNotice(null) }} className="rounded border border-line bg-white px-2 py-1 font-semibold">
              {t('askClear')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3" aria-live="polite">
        {chat.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="ml-10 rounded-md rounded-br-none bg-ink px-3 py-2 text-[15px] text-white">{m.content}</div>
          ) : (
            <div key={i} className={`mr-4 rounded-md rounded-bl-none border bg-white px-3 py-2.5 ${m.emergency ? 'border-sos' : 'border-line'}`}>
              {m.emergency && (
                <div className="-mx-3 -mt-2.5 mb-2 flex items-center gap-1.5 rounded-t-md bg-sos px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                  <Icon.Alert width={14} height={14} /> {t('emergencyBanner')}
                </div>
              )}
              <p className="whitespace-pre-line text-[15px] leading-relaxed">{m.content}</p>
              {m.actions?.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {m.actions.map((a) => <ActionButton key={a} action={a} />)}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between text-[10px] text-ink-soft">
                <span>{m.engine === 'rules' ? t('askByRules') : t('askByAi')}</span>
                {speech.canSpeak && (
                  <button type="button" onClick={() => speech.speak(m.content)} className="inline-flex items-center gap-1 font-semibold text-info">
                    <Icon.Speaker width={12} height={12} /> {t('readAloud')}
                  </button>
                )}
              </div>
            </div>
          ),
        )}

        {busy && (
          <div className="mr-4 inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink-soft">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink-soft border-t-transparent" /> {t('askThinking')}
          </div>
        )}

        {(notice || network === 'offline') && (
          <div className="rounded-md border border-warn bg-warn-bg p-3 text-sm text-warn">
            <p>{t(notice ?? 'askOffline')}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['GUIDE_FLOOD', 'GUIDE_LANDSLIDE', 'GUIDE_EARTHQUAKE', 'OPEN_SOS'].map((a) => <ActionButton key={a} action={a} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {suggestions.length > 0 && !busy && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {suggestions.map((q) => (
            <button key={q} type="button" onClick={() => send(q)} className="rounded-full border border-info/40 bg-info-bg px-3 py-1.5 text-left text-xs font-medium text-info">
              {q}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="sticky bottom-0 mt-3 bg-paper pb-2 pt-2">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
            placeholder={t('askPlaceholder')}
            aria-label={t('askPlaceholder')}
            maxLength={1500}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-md border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-ink"
          />
          {speech.canListen && network !== 'offline' && (
            <button type="button" onClick={() => speech.listen((text) => setInput((v) => (v ? `${v} ${text}` : text)))}
              className={`rounded-md p-3 ${speech.listening ? 'bg-sos text-white' : 'border border-line bg-white'}`} aria-label="Voice input">
              <Icon.Mic width={18} height={18} />
            </button>
          )}
          <button type="submit" disabled={busy || !input.trim()} className="rounded-md bg-ink p-3 text-white disabled:opacity-40" aria-label={t('askSend')}>
            <Icon.Send width={18} height={18} />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-ink-soft">
          {t('askDisclaimer')}{' '}
          <button type="button" onClick={() => navigate('/sos')} className="font-semibold text-sos underline">SOS</button>
        </p>
      </form>
    </div>
  )
}
