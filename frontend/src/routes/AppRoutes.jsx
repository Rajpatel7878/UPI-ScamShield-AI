import { FileText, LogIn, ShieldCheck, UserPlus } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'
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
import PlaceholderPage from '../pages/PlaceholderPage.jsx'
import Settings from '../pages/Settings.jsx'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/detect" element={<Detection />} />
        <Route path="/history" element={<History />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/awareness" element={<Awareness />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/status" element={<Home />} />
        <Route path="/design-system" element={<DesignSystem />} />

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
        <Route
          path="/privacy"
          element={
            <PlaceholderPage
              eyebrow="Legal"
              title="Privacy Policy"
              description="This policy has not been published yet."
              icon={FileText}
              note="This placeholder is reserved for the privacy policy that will be published before analysis features accept real content. The current build stores no submitted messages or links."
            />
          }
        />
        <Route
          path="/terms"
          element={
            <PlaceholderPage
              eyebrow="Legal"
              title="Terms of Use"
              description="These terms have not been published yet."
              icon={ShieldCheck}
              note="This placeholder is reserved for the terms that will accompany the product. Nothing on this site provides a guaranteed fraud assessment or replaces verification with your bank."
            />
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
