import { Link, useNavigate } from 'react-router'
import { useLang } from '../i18n/index.jsx'
import { LANGUAGES } from '../i18n/strings.js'
import { useSync } from '../lib/sync.jsx'
import { Icon } from './icons.jsx'

export function NetworkBadge() {
  const { network } = useSync()
  const { t } = useLang()
  const style = {
    online: 'bg-ok-bg text-ok',
    weak: 'bg-warn-bg text-warn',
    offline: 'bg-ink text-white',
  }[network]
  const Glyph = network === 'offline' ? Icon.NoSignal : Icon.Signal
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold ${style}`} role="status">
      <Glyph width={14} height={14} />
      {t(network)}
    </span>
  )
}

function LanguageSwitch() {
  const { lang, setLang } = useLang()
  return (
    <div className="flex rounded border border-white/20 text-xs" role="group" aria-label="Language">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={`px-2 py-1 ${lang === l.code ? 'bg-white text-ink font-semibold' : 'text-white/80'}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

export function Header() {
  const { t } = useLang()
  return (
    <header className="sticky top-0 z-[1000] bg-ink text-white">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="leading-tight">
          <span className="block text-[15px] font-bold tracking-tight">{t('appName')}</span>
          <span className="block text-[11px] uppercase tracking-[0.12em] text-white/60">{t('region')}</span>
        </Link>
        <LanguageSwitch />
      </div>
    </header>
  )
}

export function PageTitle({ children, back = true }) {
  const navigate = useNavigate()
  const { t } = useLang()
  return (
    <div className="mb-4 flex items-center gap-2">
      {back && (
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="-ml-2 rounded p-2 text-ink-soft hover:bg-black/5"
          aria-label={t('back')}
        >
          <Icon.Back />
        </button>
      )}
      <h1 className="text-xl font-bold tracking-tight">{children}</h1>
    </div>
  )
}

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`rounded-md border border-line bg-card ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function SampleTag() {
  const { t } = useLang()
  return (
    <span className="rounded-sm border border-current px-1 py-px text-[10px] font-semibold uppercase tracking-wide opacity-70">
      {t('sampleData')}
    </span>
  )
}
