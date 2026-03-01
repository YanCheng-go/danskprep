import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { HomePage } from '@/pages/HomePage'
import { StudyPage } from '@/pages/StudyPage'
import { GrammarPage } from '@/pages/GrammarPage'
import { GrammarTopicPage } from '@/pages/GrammarTopicPage'
import { QuizPage } from '@/pages/QuizPage'
import { VocabularyPage } from '@/pages/VocabularyPage'
import { ProgressPage } from '@/pages/ProgressPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { SettingsPage } from '@/pages/SettingsPage'

export function App() {
  return (
    <BrowserRouter>
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
          <Route path="vocabulary" element={<VocabularyPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
