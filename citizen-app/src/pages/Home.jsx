import { Link } from 'react-router'
import { Card, NetworkBadge, SampleTag } from '../components/Layout.jsx'
import { Icon } from '../components/icons.jsx'
import { ALERT, HELPLINES, STATES } from '../data/reference.js'
import { useHomeState } from '../lib/region.js'
import { useLang } from '../i18n/index.jsx'
import { useSync } from '../lib/sync.jsx'
import { DeliveryChip } from './RequestStatus.jsx'

export default function Home() {
  const { t, lang } = useLang()
  const { records } = useSync()
  const [homeState, setHomeState] = useHomeState()

  return (
    <div className="space-y-5">
      <Card className="border-l-4 border-l-sos p-3">
        <div className="mb-1 flex items-center gap-2 text-sos">
          <Icon.Alert width={16} height={16} />
          <span className="text-xs font-bold uppercase tracking-wide">{t('alertTitle')}</span>
          {ALERT.sample && <SampleTag />}
        </div>
        <p className="text-sm text-ink">{ALERT.text[lang]}</p>
      </Card>

      <section className="flex flex-col items-center pt-2 text-center">
        <div className="mb-4 flex w-full items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-xs text-ink-soft">
            <Icon.Pin width={14} height={14} />
            <select value={homeState} onChange={(e) => setHomeState(e.target.value)} aria-label={t('yourState')}
              className="rounded border border-line bg-white px-1.5 py-1 text-xs font-semibold text-ink">
              {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </label>
          <NetworkBadge />
        </div>
        <Link
          to="/sos"
          className="sos-pulse flex h-44 w-44 items-center justify-center rounded-full bg-sos text-5xl font-black tracking-wider text-white ring-8 ring-sos/15 active:bg-sos-dark"
          aria-label={t('sosHint')}
        >
          SOS
        </Link>
        <p className="mt-5 text-lg font-semibold">{t('sosHint')}</p>
        <p className="mt-1 max-w-xs text-sm text-ink-soft">{t('sosOfflineNote')}</p>
      </section>

      {records.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">{t('yourRequests')}</h2>
          <Card className="divide-y divide-line">
            {records.slice(0, 5).map((r) => (
              <Link key={r.clientRequestId} to={`/request/${r.clientRequestId}`} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="font-mono text-sm font-semibold">{r.reference ?? '—'}</div>
                  <div className="truncate text-xs text-ink-soft">
                    {t(`cat_${r.payload.category}`)} · {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <DeliveryChip record={r} />
                  <Icon.Chevron width={16} height={16} className="text-ink-soft" />
                </div>
              </Link>
            ))}
          </Card>
        </section>
      )}

      <Link to="/assistant" className="block">
        <Card className="flex items-center gap-3 border-info/40 bg-info-bg p-3">
          <span className="rounded-md bg-info p-2 text-white"><Icon.Chat /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">{t('askTitle')}</span>
            <span className="block text-xs text-ink-soft">{t('askHomeSub')}</span>
          </span>
          <Icon.Chevron className="text-info" />
        </Card>
      </Link>

      <section className="grid grid-cols-2 gap-3">
        <Link to="/safety">
          <Card className="h-full p-3">
            <Icon.Shield className="mb-2 text-info" />
            <div className="font-semibold">{t('safety')}</div>
            <div className="text-xs text-ink-soft">{t('safetySub')}</div>
          </Card>
        </Link>
        <Link to="/shelters">
          <Card className="h-full p-3">
            <Icon.Tent className="mb-2 text-info" />
            <div className="font-semibold">{t('shelters')}</div>
            <div className="text-xs text-ink-soft">{t('sheltersSub')}</div>
          </Card>
        </Link>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">{t('helplines')}</h2>
        <Card className="divide-y divide-line">
          {HELPLINES.map((h) => (
            <a key={h.number} href={`tel:${h.number}`} className="flex items-center justify-between p-3">
              <span className="text-sm">{t(h.key)}</span>
              <span className="inline-flex items-center gap-2 font-mono text-lg font-bold text-sos">
                <Icon.Phone width={16} height={16} />
                {h.number}
              </span>
            </a>
          ))}
        </Card>
      </section>
    </div>
  )
}
