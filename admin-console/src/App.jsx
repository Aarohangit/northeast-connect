import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import TopBar from './components/TopBar.jsx'
import { AuthProvider, useAuth } from './lib/auth.jsx'
import { DataProvider } from './lib/data.jsx'
import Command from './pages/Command.jsx'
import Login from './pages/Login.jsx'
import Teams from './pages/Teams.jsx'

function Shell() {
  const { user } = useAuth()
  if (!user) return <Login />
  return (
    <DataProvider>
      <div className="flex h-full flex-col">
        <TopBar />
        <main className="flex min-h-0 flex-1 flex-col">
          <Routes>
            <Route path="/" element={<Command />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </DataProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  )
}
