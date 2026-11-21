import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { Card } from '../components/Layout.jsx'
import { Icon } from '../components/icons.jsx'
import { useLang } from '../i18n/index.jsx'

// Set VITE_DONATION_UPI to the official relief fund's UPI ID. The default is deliberately not a
// valid UPI ID (no "@"), so a demo QR can never send money to a stranger.
const UPI_ID = import.meta.env.VITE_DONATION_UPI || 'relief-fund-demo'
const PAYEE = import.meta.env.VITE_DONATION_NAME || 'North East Flood Relief Fund (demo)'
const IS_DEMO = !UPI_ID.includes('@')

const AMOUNTS = [200, 500, 1000, 2000]

export default function Donate() {
  const { t } = useLang()
  const [amount, setAmount] = useState(500)
  const [qr, setQr] = useState(null)
  const [copied, setCopied] = useState(false)

  const params = new URLSearchParams({ pa: UPI_ID, pn: PAYEE, cu: 'INR', tn: 'Northeast Connect relief' })
  if (amount) params.set('am', String(amount))
  const upiLink = `upi://pay?${params.toString()}`

  useEffect(() => {
    QRCode.toDataURL(upiLink, { width: 480, margin: 1, color: { dark: '#15191f', light: '#ffffff' } }).then(setQr)
  }, [upiLink])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked; the ID is visible anyway */
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t('donateTitle')}</h1>
        <p className="text-xs text-ink-soft">{t('donateSub')}</p>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-ink px-4 py-3 text-white">
          <div className="text-[10px] uppercase tracking-[0.14em] text-white/60">{t('donateTo')}</div>
          <div className="font-semibold">{PAYEE}</div>
        </div>
        <div className="flex flex-col items-center p-4">
          {qr ? <img src={qr} alt={`UPI QR code, ${amount ? `₹${amount}` : ''} to ${PAYEE}`} className="h-60 w-60" /> : <div className="h-60 w-60 animate-pulse bg-paper" />}
          <div className="mt-2 text-3xl font-black tabular-nums">{amount ? `₹${amount.toLocaleString('en-IN')}` : t('donateOther')}</div>
          <button type="button" onClick={copy} className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-ink-soft">
            {UPI_ID} · <span className="font-sans font-semibold text-info">{copied ? t('copied') : t('copyUpi')}</span>
          </button>
          {IS_DEMO && <p className="mt-3 rounded bg-warn-bg px-2 py-1.5 text-center text-[11px] text-warn">{t('donateSample')}</p>}
        </div>
      </Card>

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">{t('donateAmount')}</h2>
        <div className="grid grid-cols-5 gap-2">
          {AMOUNTS.map((a) => (
            <button key={a} type="button" onClick={() => setAmount(a)} aria-pressed={amount === a}
              className={`rounded-md border py-2.5 text-sm font-bold tabular-nums ${amount === a ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>
              ₹{a}
            </button>
          ))}
          <button type="button" onClick={() => setAmount(0)} aria-pressed={amount === 0}
            className={`rounded-md border py-2.5 text-[11px] font-bold ${amount === 0 ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>
            {t('donateOther')}
          </button>
        </div>
      </div>

      <a href={upiLink} aria-disabled={IS_DEMO}
        onClick={(e) => IS_DEMO && e.preventDefault()}
        className={`flex items-center justify-center gap-2 rounded-md py-3.5 font-bold text-white ${IS_DEMO ? 'bg-ink/40' : 'bg-ok'}`}>
        <Icon.Heart width={18} height={18} /> {t('donatePayApp')}
      </a>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t('donatePays')}</h2>
          <span className="text-[10px] text-ink-soft">{t('indicative')}</span>
        </div>
        <ul className="space-y-2">
          {AMOUNTS.map((a) => (
            <li key={a} className="flex items-start gap-3 text-sm">
              <span className="w-14 shrink-0 font-bold tabular-nums">₹{a}</span>
              <span className="text-ink-soft">{t(`don${a}`)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <p className="text-center text-[11px] text-ink-soft">{t('donateNote')}</p>
    </div>
  )
}
