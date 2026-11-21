import { useState } from 'react'
import { Card, PageTitle } from '../components/Layout.jsx'
import { Icon } from '../components/icons.jsx'
import { HAZARDS, SAFETY } from '../data/reference.js'
import { useLang } from '../i18n/index.jsx'

const HAZARD_ICON = { flood: Icon.Water, landslide: Icon.Landslide, earthquake: Icon.Quake }

export default function Safety() {
  const { t } = useLang()
  const [hazard, setHazard] = useState(() => new URLSearchParams(window.location.search).get('hazard') || 'flood')
  const guide = SAFETY[hazard] ?? SAFETY.flood

  return (
    <div className="space-y-4">
      <PageTitle>{t('safety')}</PageTitle>
      <p className="-mt-2 inline-flex items-center gap-1.5 rounded bg-ok-bg px-2 py-1 text-xs font-semibold text-ok">
        <Icon.Check width={14} height={14} /> {t('availableOffline')}
      </p>

      <div className="grid grid-cols-3 gap-2" role="tablist">
        {HAZARDS.map((h) => {
          const Glyph = HAZARD_ICON[h]
          const active = h === hazard
          return (
            <button key={h} type="button" role="tab" aria-selected={active} onClick={() => setHazard(h)}
              className={`flex flex-col items-center gap-1 rounded-md border py-2.5 text-sm font-semibold ${active ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>
              <Glyph /> {t(`hz_${h}`)}
            </button>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <h2 className="bg-ok px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">{t('doTitle')}</h2>
        <ol className="divide-y divide-line">
          {guide.dos.map((k, i) => (
            <li key={k} className="flex gap-3 px-4 py-3 text-[15px]">
              <span className="font-mono text-sm font-bold text-ok">{i + 1}</span>
              <span>{t(k)}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="overflow-hidden">
        <h2 className="bg-sos px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">{t('dontTitle')}</h2>
        <ol className="divide-y divide-line">
          {guide.donts.map((k, i) => (
            <li key={k} className="flex gap-3 px-4 py-3 text-[15px]">
              <span className="font-mono text-sm font-bold text-sos">{i + 1}</span>
              <span>{t(k)}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
