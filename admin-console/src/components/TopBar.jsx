import { NavLink } from 'react-router'
import { useAuth } from '../lib/auth.jsx'
import { useData, useTick } from '../lib/data.jsx'
import { clock } from '../lib/format.js'

const ROLE_LABEL = {
  SUPER_ADMIN: 'State control room',
  DISTRICT_ADMIN: 'District admin',
  RESCUE_COORDINATOR: 'Rescue coordinator',
  RESCUE_TEAM: 'Rescue team',
}

function LiveIndicator() {
  const { lastOk, error } = useData()
  useTick(5000)
  if (error) {
    return (
      <span className="inline-flex items-center gap-2 rounded-sm bg-crit px-2 py-1 text-xs font-semibold text-white" role="alert">
        Connection lost{lastOk ? ` · showing data from ${clock(lastOk)}` : ''}
      </span>
    )
  }
  const age = lastOk ? Math.round((Date.now() - lastOk) / 1000) : null
  return (
    <span className="inline-flex items-center gap-2 text-xs text-white/70">
      <span className="live-dot h-2 w-2 rounded-full bg-[#3ecf6e]" />
      Live{age != null ? ` · updated ${age}s ago` : ''}
    </span>
  )
}

export default function TopBar() {
  const { user, logout } = useAuth()
  const link = ({ isActive }) =>
    `px-3.5 py-1.5 rounded-full text-[13px] font-semibold ${isActive ? 'bg-white text-ink' : 'text-white/70 hover:text-white'}`
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 bg-[linear-gradient(120deg,#0b1d30_0%,#123a5a_100%)] px-5 text-white shadow-[0_2px_12px_rgb(11_29_48/0.25)]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />
          <div className="leading-tight">
            <div className="text-[13px] font-bold tracking-tight">Northeast Connect · Control Room</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-white/50">North East India · {user.district ?? 'All states'}</div>
          </div>
        </div>
        <nav className="flex gap-1">
          <NavLink to="/" end className={link}>Command</NavLink>
          <NavLink to="/teams" className={link}>Teams &amp; operations</NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-5">
        <LiveIndicator />
        <div className="text-right leading-tight">
          <div className="text-[13px] font-semibold">{user.name}</div>
          <div className="text-[10px] text-white/50">{ROLE_LABEL[user.role]} · {user.username}</div>
        </div>
        <button type="button" onClick={logout} className="rounded-sm border border-white/20 px-2.5 py-1 text-xs text-white/80 hover:bg-white/10">
          Sign out
        </button>
      </div>
    </header>
  )
}
