import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Header } from './components/Layout.jsx'
import { LangProvider } from './i18n/index.jsx'
import { SyncProvider } from './lib/sync.jsx'
import BottomNav from './components/BottomNav.jsx'
import Assistant from './pages/Assistant.jsx'
import Donate from './pages/Donate.jsx'
import Home from './pages/Home.jsx'
import RequestStatus from './pages/RequestStatus.jsx'
import Safety from './pages/Safety.jsx'
import Sos from './pages/Sos.jsx'

// The map library is the heaviest part of the app; load it only on the shelters page.
const Shelters = lazy(() => import('./pages/Shelters.jsx'))
const LiveMap = lazy(() => import('./pages/LiveMap.jsx'))

export default function App() {
  return (
    <LangProvider>
      <SyncProvider>
        <BrowserRouter>
          <Header />
          <main id="main" tabIndex={-1} className="mx-auto max-w-md px-4 pb-24 pt-4 outline-none">
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/sos" element={<Sos />} />
                <Route path="/request/:id" element={<RequestStatus />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/map" element={<LiveMap />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/shelters" element={<Shelters />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
          <BottomNav />
        </BrowserRouter>
      </SyncProvider>
    </LangProvider>
  )
}
