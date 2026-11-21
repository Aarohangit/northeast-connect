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
    `px-3 py-1.5 rounded-sm text-[13px] font-medium ${isActive ? 'bg-white/12 text-white' : 'text-white/65 hover:text-white'}`
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 bg-ink px-4 text-white">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="" className="h-6 w-6" />
          <div className="leading-tight">
            <div className="text-[13px] font-bold tracking-tight">Flood Control Room</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-white/50">Assam · {user.district ?? 'All districts'}</div>
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
