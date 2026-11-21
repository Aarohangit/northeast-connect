import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Card, PageTitle } from '../components/Layout.jsx'
import { Icon } from '../components/icons.jsx'
import { useLang } from '../i18n/index.jsx'
import { fetchStatus, updateLocation } from '../lib/api.js'
import { getPosition } from '../lib/geo.js'
import { getRecord, patchRecord } from '../lib/outbox.js'
import { useSync } from '../lib/sync.jsx'

const POLL_MS = 15_000
const SMS_NUMBER = import.meta.env.VITE_SMS_NUMBER

// How far along the rescue workflow each server status is.
const PROGRESS = { RECEIVED: 1, VERIFIED: 2, TEAM_ASSIGNED: 3, IN_PROGRESS: 4, RESCUED: 5 }

const time = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export function DeliveryChip({ record }) {
  const { t } = useLang()
  const status = record.lastStatus?.status
  if (record.state === 'failed') return <Chip tone="bad">!</Chip>
  if (record.state !== 'delivered') return <Chip tone="warn">{t('step_saved')}</Chip>
  if (status === 'RESCUED') return <Chip tone="ok">{t('step_rescued')}</Chip>
  if (status === 'TEAM_ASSIGNED' || status === 'IN_PROGRESS') return <Chip tone="ok">{t('step_assigned')}</Chip>
  return <Chip tone="info">{t('step_sent')}</Chip>
}

function Chip({ tone, children }) {
  const cls = { ok: 'bg-ok-bg text-ok', warn: 'bg-warn-bg text-warn', info: 'bg-info-bg text-info', bad: 'bg-sos text-white' }[tone]
  return <span className={`whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>
}

function Step({ state, title, last = false, children }) {
  const dot = {
    done: <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ok text-white"><Icon.Check width={14} height={14} /></span>,
    active: <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-warn bg-warn-bg"><span className="h-2 w-2 animate-pulse rounded-full bg-warn" /></span>,
    todo: <span className="block h-6 w-6 rounded-full border-2 border-line bg-white" />,
  }[state]
  return (
    <li className={`relative flex gap-3 ${last ? '' : 'pb-5'}`}>
      {!last && <span className="absolute bottom-0 left-3 top-6 -ml-px w-0.5 bg-line" aria-hidden />}
      <span className="relative z-10 block shrink-0">{dot}</span>
      <div className="min-w-0 pt-0.5">
        <div className={`text-sm font-semibold ${state === 'todo' ? 'text-ink-soft' : ''}`}>{title}</div>
        {children && <div className="mt-1 text-sm text-ink-soft">{children}</div>}
      </div>
    </li>
  )
}

export default function RequestStatus() {
  const { id } = useParams()
  const { t } = useLang()
  const { records, network, flush } = useSync()
  const [record, setRecord] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [locMsg, setLocMsg] = useState(null)

  // Re-read whenever the outbox changes (sent by the page or by the service worker).
  useEffect(() => {
    getRecord(id).then((r) => {
      setRecord(r ?? null)
      setLoaded(true)
    })
  }, [id, records])

  const poll = useCallback(async () => {
    if (!record?.reference || !navigator.onLine) return
    try {
      const status = await fetchStatus(record.reference)
      await patchRecord(record.clientRequestId, { lastStatus: status, lastCheckedAt: Date.now() })
    } catch {
      // Keep showing the last known status.
    }
  }, [record?.reference, record?.clientRequestId])

  useEffect(() => {
    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => clearInterval(timer)
  }, [poll])

  if (!loaded) return null
  if (!record) {
    return (
      <div>
        <PageTitle>{t('statusTitle')}</PageTitle>
        <p className="text-ink-soft">{t('notFound')}</p>
      </div>
    )
  }

  const delivered = record.state === 'delivered'
  const server = record.lastStatus?.status
  const progress = delivered ? PROGRESS[server] ?? 1 : 0
  const closedOther = server === 'REJECTED' || server === 'DUPLICATE'
  const stepState = (n) => (progress >= n ? 'done' : progress === n - 1 && !closedOther ? 'active' : 'todo')

  const sendLocation = async () => {
    setLocMsg(null)
    if (!navigator.onLine) return setLocMsg({ ok: false, text: t('needsNetwork') })
    try {
      const p = await getPosition()
      await updateLocation(record.reference, { latitude: p.latitude, longitude: p.longitude, accuracyMeters: p.accuracy })
      setLocMsg({ ok: true, text: t('locationUpdated') })
    } catch (e) {
      setLocMsg({ ok: false, text: e.message === 'denied' ? t('locDenied') : t('needsNetwork') })
    }
  }

  const p = record.payload
  const smsBody = `SOS ${p.category} ${p.peopleCount}P ${p.latitude},${p.longitude} ${p.name} ${p.phone} ID:${record.clientRequestId.slice(0, 8)}`

  return (
    <div className="space-y-4">
      <PageTitle>{t('statusTitle')}</PageTitle>

      <Card className="p-4 text-center">
        <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t('reference')}</div>
        {delivered ? (
          <div className="mt-1 font-mono text-3xl font-bold tracking-wider">{record.reference}</div>
        ) : (
          <div className="mt-2 text-sm text-ink-soft">{t('refPending')}</div>
        )}
        <div className="mt-2 text-xs text-ink-soft">
          {t(`cat_${p.category}`)} · {p.peopleCount} · <span className="font-mono">{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</span>
        </div>
      </Card>

      {record.state === 'failed' && (
        <Card className="border-sos bg-sos/5 p-3 text-sm text-sos">
          {t('failed', { err: record.lastError })}
          <a href="tel:112" className="mt-2 block rounded bg-sos py-2 text-center font-bold text-white">{t('callNow')}</a>
        </Card>
      )}

      <Card className="p-4">
        <ol>
          <Step state="done" title={t('step_saved')}>{new Date(record.createdAt).toLocaleString()}</Step>
          <Step state={delivered ? 'done' : record.state === 'failed' ? 'todo' : 'active'} title={t('step_sent')}>
            {delivered && time(record.deliveredAt)}
            {!delivered && record.state !== 'failed' && (
              <>
                <p>{record.state === 'sending' ? t('sending') : network === 'offline' ? t('waitingNetwork') : t('sending')}</p>
                {record.attempts > 0 && <p className="mt-1 text-xs">{t('attempts', { n: record.attempts, t: time(record.lastAttemptAt) })}</p>}
              </>
            )}
            {delivered && progress === 1 && !closedOther && <p className="mt-1">{t('notReviewed')}</p>}
          </Step>
          {closedOther ? (
            <Step state="done" title={t(`status_${server}`)} last />
          ) : (
            <>
              <Step state={stepState(2)} title={t('step_verified')} />
              <Step state={stepState(3)} title={t('step_assigned')} />
              <Step state={stepState(4)} title={t('step_onway')} />
              <Step state={stepState(5)} title={t('step_rescued')} last />
            </>
          )}
        </ol>

        {record.lastStatus?.history?.length > 1 && (
          <ul className="mt-4 space-y-1 border-t border-line pt-3 text-xs text-ink-soft">
            {record.lastStatus.history.slice(1).map((h, i) => (
              <li key={i}><span className="font-mono">{time(h.at)}</span> · {h.note}</li>
            ))}
          </ul>
        )}
        {record.lastCheckedAt && <p className="mt-3 text-[11px] text-ink-soft">{t('lastChecked', { t: time(record.lastCheckedAt) })}</p>}
      </Card>

      {!delivered && record.state !== 'failed' && (
        <div className="flex gap-2">
          <button type="button" onClick={flush} className="flex-1 rounded-md border border-ink py-2.5 text-sm font-semibold">
            <Icon.Refresh width={16} height={16} className="mr-1 inline" /> {t('retry')}
          </button>
          {SMS_NUMBER && (
            <a href={`sms:${SMS_NUMBER}?body=${encodeURIComponent(smsBody)}`} className="flex-1 rounded-md border border-ink py-2.5 text-center text-sm font-semibold">
              <Icon.Message width={16} height={16} className="mr-1 inline" /> {t('smsFallback')}
            </a>
          )}
        </div>
      )}

      {delivered && !closedOther && server !== 'RESCUED' && (
        <div>
          <button type="button" onClick={sendLocation} className="w-full rounded-md border border-ink py-2.5 text-sm font-semibold">
            <Icon.Pin width={16} height={16} className="mr-1 inline" /> {t('updateLocation')}
          </button>
          {locMsg && <p className={`mt-2 text-sm ${locMsg.ok ? 'text-ok' : 'text-sos'}`}>{locMsg.text}</p>}
        </div>
      )}

      <Card className="p-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">{t('whileWaiting')}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>{t('do1')}</li>
          <li>{t('do5')}</li>
          <li>{t('do3')}</li>
          <li>{t('dont2')}</li>
        </ul>
        <Link to="/safety" className="mt-3 inline-block text-sm font-semibold text-info">{t('safety')} →</Link>
      </Card>
    </div>
  )
}
