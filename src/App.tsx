import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { I18nProvider } from '@/lib/i18n'
import { Layout } from '@/components/layout/Layout'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { SETTINGS_KEYS } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'

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
const WritingPage = lazy(() =>
  import('@/pages/WritingPage').then(m => ({ default: m.WritingPage }))
)
const SpeakingPage = lazy(() =>
  import('@/pages/SpeakingPage').then(m => ({ default: m.SpeakingPage }))
)
const ListeningPage = lazy(() =>
  import('@/pages/ListeningPage').then(m => ({ default: m.ListeningPage }))
)
const DictionaryPage = lazy(() =>
  import('@/pages/DictionaryPage').then(m => ({ default: m.DictionaryPage }))
)
const NewsletterPage = lazy(() =>
  import('@/pages/NewsletterPage').then(m => ({ default: m.NewsletterPage }))
)
const ModultestPage = lazy(() =>
  import('@/pages/ModultestPage').then(m => ({ default: m.ModultestPage }))
)
const VocabularyPage = lazy(() =>
  import('@/pages/VocabularyPage').then(m => ({ default: m.VocabularyPage }))
)
const ProgressPage = lazy(() =>
  import('@/pages/ProgressPage').then(m => ({ default: m.ProgressPage }))
)
const UpdatesPage = lazy(() =>
  import('@/pages/UpdatesPage').then(m => ({ default: m.UpdatesPage }))
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage }))
)
const WelcomePage = lazy(() =>
  import('@/pages/WelcomePage').then(m => ({ default: m.WelcomePage }))
)

/** Show welcome page on first visit, home page after that */
function LandingGate() {
  const seen = localStorage.getItem(SETTINGS_KEYS.WELCOME_SEEN) === 'true'
  if (!seen) return <WelcomePage />
  return <Navigate to="/home" replace />
}

/** Navigating to /welcome redirects signed-in users to /home */
function WelcomeGate() {
  const { user } = useAuth()
  if (user) return <Navigate to="/home" replace />
  return <WelcomePage />
}

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
      <I18nProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing: welcome for first visit, redirect to /home after */}
          <Route index element={<LandingGate />} />
          <Route path="/welcome" element={<WelcomeGate />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* App routes */}
          <Route
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            <Route path="home" element={<HomePage />} />
            <Route path="study" element={<StudyPage />} />
            <Route path="grammar" element={<GrammarPage />} />
            <Route path="grammar/:slug" element={<GrammarTopicPage />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="drill" element={<DrillPage />} />
            <Route path="writing" element={<WritingPage />} />
            <Route path="speaking" element={<SpeakingPage />} />
            <Route path="dictionary" element={<DictionaryPage />} />
            <Route path="podcast" element={<ListeningPage />} />
            <Route path="newsletter" element={<NewsletterPage />} />
            <Route path="modultest" element={<ModultestPage />} />
            <Route path="vocabulary" element={<VocabularyPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="updates" element={<UpdatesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>

      {/* Vercel observability — injected outside the router, no UI rendered */}
      <Analytics />
      <SpeedInsights />
      </I18nProvider>
    </BrowserRouter>
  )
}
