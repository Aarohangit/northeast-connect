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
    <div className="flex overflow-hidden rounded-full border border-white/20 bg-white/5 text-xs" role="group" aria-label="Language">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={`px-2.5 py-1 ${lang === l.code ? 'rounded-full bg-white text-ink font-semibold' : 'text-white/75'}`}
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
    <>
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[2000] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:font-semibold focus:text-ink">Skip to content</a>
    <header className="sticky top-0 z-[1000] bg-[linear-gradient(120deg,#0b1d30_0%,#123a5a_100%)] text-white shadow-[0_2px_12px_rgb(11_29_48/0.25)]">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5 leading-tight">
          <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />
          <span>
            <span className="block text-[15px] font-bold tracking-tight">{t('appName')}</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">{t('region')}</span>
          </span>
        </Link>
        <LanguageSwitch />
      </div>
    </header>
    </>
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
      <h1 className="text-[22px] font-bold tracking-tight">{children}</h1>
    </div>
  )
}

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`rounded-xl border border-[#0f2237]/[0.06] bg-card shadow-[0_1px_2px_rgb(15_34_55/0.05),0_2px_8px_rgb(15_34_55/0.04)] ${className}`} {...rest}>
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
