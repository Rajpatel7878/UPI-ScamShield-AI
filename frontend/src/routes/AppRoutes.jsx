import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '../components/layout/AppLayout.jsx'
import { ProtectedRoute } from '../components/routing/ProtectedRoute.jsx'
import MainLayout from '../layouts/MainLayout.jsx'
import Landing from '../pages/Landing.jsx'

// Internal pages are split into their own chunks. The landing page stays eager
// because it is the first route most visitors load.
const Analytics = lazy(() => import('../pages/Analytics.jsx'))
const AuthPage = lazy(() => import('../pages/AuthPage.jsx'))
const Awareness = lazy(() => import('../pages/Awareness.jsx'))
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'))
const Detection = lazy(() => import('../pages/Detection.jsx'))
const History = lazy(() => import('../pages/History.jsx'))
const NotFound = lazy(() => import('../pages/NotFound.jsx'))
const Settings = lazy(() => import('../pages/Settings.jsx'))

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-64 items-center justify-center rounded-card border border-white/8 bg-navy-800 p-8"
    >
      <span className="text-sm text-slate-400">Loading page…</span>
    </div>
  )
}

function page(element) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
}

function protectedPage(element) {
  return <ProtectedRoute>{page(element)}</ProtectedRoute>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
        <Route path="/detect" element={protectedPage(<Detection />)} />
        <Route path="/history" element={protectedPage(<History />)} />
        <Route path="/analytics" element={protectedPage(<Analytics />)} />
        <Route path="/awareness" element={page(<Awareness />)} />
        <Route path="/settings" element={protectedPage(<Settings />)} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/login" element={page(<AuthPage mode="login" />)} />
        <Route path="/register" element={page(<AuthPage mode="register" />)} />
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={page(<NotFound />)} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
