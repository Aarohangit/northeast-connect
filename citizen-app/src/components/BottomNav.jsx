import { NavLink, useLocation } from 'react-router'
import { useLang } from '../i18n/index.jsx'
import { Icon } from './icons.jsx'

const ITEMS = [
  { to: '/', key: 'navHome', icon: 'Home', end: true },
  { to: '/map', key: 'navMap', icon: 'Map' },
  { to: '/sos', key: 'sos', icon: null },
  { to: '/assistant', key: 'navAsk', icon: 'Chat' },
  { to: '/donate', key: 'navDonate', icon: 'Heart' },
]

/** App-style bottom bar. Hidden on the SOS form and status screens, which have their own actions. */
export default function BottomNav() {
  const { t } = useLang()
  const { pathname } = useLocation()
  if (pathname === '/sos' || pathname.startsWith('/request/')) return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-[#0f2237]/[0.06] bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgb(15_34_55/0.08)] backdrop-blur-md" aria-label="Main">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((item) => {
          if (!item.icon) {
            return (
              <li key={item.to} className="flex justify-center">
                <NavLink to="/sos" aria-label={t('sosHint')}
                  className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-sos text-sm font-black tracking-wide text-white shadow-[0_4px_14px_rgb(200_16_46/0.45)] ring-4 ring-white">
                  SOS
                </NavLink>
              </li>
            )
          }
          const Glyph = Icon[item.icon]
          return (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end}
                className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-info' : 'text-ink-soft'}`}>
                {({ isActive }) => (
                  <>
                    <Glyph width={22} height={22} strokeWidth={isActive ? 2.4 : 1.8} />
                    <span className="max-w-full truncate px-1">{t(item.key)}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
