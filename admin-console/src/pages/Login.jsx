import { useState } from 'react'
import { useAuth } from '../lib/auth.jsx'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(username, password)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-[radial-gradient(120%_90%_at_50%_0%,#1d4f78_0%,#0f2237_60%,#0b1a2b_100%)] p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3 text-white">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="h-9 w-9" />
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight">Northeast Connect · Control Room</div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">North East India · Authorised staff only</div>
          </div>
        </div>
        <form onSubmit={submit} className="rounded-2xl bg-panel p-6 shadow-[0_20px_50px_rgb(0_0_0/0.35)]">
          <label className="mb-3 block">
            <span className="mb-1 block text-[12px] font-semibold text-muted">Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus
              className="w-full rounded-sm border border-line px-2.5 py-2 outline-none focus:border-ink" />
          </label>
          <label className="mb-4 block">
            <span className="mb-1 block text-[12px] font-semibold text-muted">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              className="w-full rounded-sm border border-line px-2.5 py-2 outline-none focus:border-ink" />
          </label>
          {error && <p className="mb-3 text-[13px] text-crit" role="alert">{error}</p>}
          <button type="submit" disabled={busy || !username || !password}
            className="w-full rounded-sm bg-ink py-2.5 font-semibold text-white hover:bg-ink-2 disabled:opacity-50">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="mt-4 text-[11px] leading-relaxed text-faint">
            Activity is logged. Citizen details shown here are for rescue coordination only.
          </p>
        </form>
      </div>
    </div>
  )
}
