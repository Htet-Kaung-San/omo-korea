import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { useLanguage } from '@/context/LanguageContext'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { HomePage } from '@/pages/HomePage'
import { AcademicPage } from '@/pages/AcademicPage'
import { ChatPage } from '@/pages/ChatPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { CampusLifePage } from '@/pages/CampusLifePage'
import { CommunityPage } from '@/pages/CommunityPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const { t } = useLanguage()

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-pnu-muted">{t('common.loading')}</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="academic" element={<AcademicPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="campus-life" element={<CampusLifePage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="my" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="courses" element={<Navigate to="/academic" replace />} />
        <Route path="checklist" element={<Navigate to="/" replace />} />
        <Route path="profile" element={<Navigate to="/my" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
