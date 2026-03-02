import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Layout } from '@/components/layout/Layout'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'

// Lazy-load heavy pages to reduce initial bundle size
const StudyPage = lazy(() =>
  import('@/pages/StudyPage').then(m => ({ default: m.StudyPage }))
)
const GrammarPage = lazy(() =>
  import('@/pages/GrammarPage').then(m => ({ default: m.GrammarPage }))
)
const GrammarTopicPage = lazy(() =>
  import('@/pages/GrammarTopicPage').then(m => ({ default: m.GrammarTopicPage }))
)
const QuizPage = lazy(() =>
  import('@/pages/QuizPage').then(m => ({ default: m.QuizPage }))
)
const DrillPage = lazy(() =>
  import('@/pages/DrillPage').then(m => ({ default: m.DrillPage }))
)
const VocabularyPage = lazy(() =>
  import('@/pages/VocabularyPage').then(m => ({ default: m.VocabularyPage }))
)
const ProgressPage = lazy(() =>
  import('@/pages/ProgressPage').then(m => ({ default: m.ProgressPage }))
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage }))
)

function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="flex h-screen items-center justify-center text-muted-foreground"
    >
      Loading…
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected app routes */}
          <Route
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="study" element={<StudyPage />} />
            <Route path="grammar" element={<GrammarPage />} />
            <Route path="grammar/:slug" element={<GrammarTopicPage />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="drill" element={<DrillPage />} />
            <Route path="vocabulary" element={<VocabularyPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Vercel observability — injected outside the router, no UI rendered */}
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  )
}
