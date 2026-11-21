import { Card, PageTitle } from '../components/Layout.jsx'
import { Icon } from '../components/icons.jsx'
import { useLang } from '../i18n/index.jsx'

const DOS = ['do1', 'do2', 'do3', 'do4', 'do5']
const DONTS = ['dont1', 'dont2', 'dont3', 'dont4', 'dont5']

export default function Safety() {
  const { t } = useLang()
  return (
    <div className="space-y-4">
      <PageTitle>{t('safety')}</PageTitle>
      <p className="-mt-2 inline-flex items-center gap-1.5 rounded bg-ok-bg px-2 py-1 text-xs font-semibold text-ok">
        <Icon.Check width={14} height={14} /> {t('availableOffline')}
      </p>

      <Card className="overflow-hidden">
        <h2 className="bg-ok px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">{t('doTitle')}</h2>
        <ol className="divide-y divide-line">
          {DOS.map((k, i) => (
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
          {DONTS.map((k, i) => (
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
