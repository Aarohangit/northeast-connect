import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, setToken, setUnauthorizedHandler } from './api.js'

const AuthContext = createContext(null)

function loadUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user'))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  const logout = useCallback(() => {
    setToken(null)
    sessionStorage.removeItem('user')
    setUser(null)
  }, [])

  useEffect(() => setUnauthorizedHandler(logout), [logout])

  const login = useCallback(async (username, password) => {
    const session = await api('/api/auth/login', { method: 'POST', body: { username, password } })
    setToken(session.token)
    sessionStorage.setItem('user', JSON.stringify(session.user))
    setUser(session.user)
  }, [])

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
