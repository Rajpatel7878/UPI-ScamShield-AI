import { FileText, LogIn, ShieldCheck, UserPlus } from 'lucide-react'
import { Route, Routes, Redirect } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout.jsx'
import MainLayout from '../layouts/MainLayout.jsx'
import Analytics from '../pages/Analytics.jsx'
import Awareness from '../pages/Awareness.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import DesignSystem from '../pages/DesignSystem.jsx'
import Detection from '../pages/Detection.jsx'
import History from '../pages/History.jsx'
import Home from '../pages/Home.jsx'
import Landing from '../pages/Landing.jsx'
import NotFound from '../pages/NotFound.jsx'
import Settings from '../pages/Settings.jsx'
import { ProtectedRoute } from '../components/routing/ProtectedRoute.js'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<AppLayout />}>

        {/* Public routes - always accessible */}

        <Route path="/login" element={<PlaceholderPage />} />
        <Route path="/register" element={<PlaceholderPage />} />
        <Route path="/privacy" element={<PlaceholderPage />} />
        <Route path="/terms" element={<PlaceholderPage />} />

        {/* Protected routes - require authentication */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute />} />
        <Route path="/detect" element={<ProtectedRoute><Detection /></ProtectedRoute />} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute />} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute />} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute />} />

      </Route>

      <Route element={<MainLayout()>}>
        <Route path="/status" element={<Home />} />
        <Route path="/design-system" element={<DesignSystem />} />

        {/* Login/Register placeholders within main layout */}
        <Route
          path="/login"
          element={
            <PlaceholderPage
              eyebrow="Accounts"
              title="Login is not available yet"
              description="Authentication, saved scans, and scan history are planned for a later phase."
              icon={LogIn}
              note="No credentials are collected on this page. It exists so the navigation is honest about what is available today."
            />
          }
        />
        <Route
          path="/register"
          element={
            <PlaceholderPage
              eyebrow="Accounts"
              title="Registration is not available yet"
              description="Account creation will ship alongside the authentication phase."
              icon={UserPlus}
              note="No sign-up form is rendered and no personal data is collected. The detection workspace and accounts are not implemented in this build."
            />
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}