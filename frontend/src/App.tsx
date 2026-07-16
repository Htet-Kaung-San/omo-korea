import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { useLanguage } from '@/context/LanguageContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { HomePage } from '@/pages/HomePage'
import { AcademicPage } from '@/pages/AcademicPage'
import { RecommendedCoursesPage } from '@/pages/RecommendedCoursesPage'
import { CourseDetailPage } from '@/pages/CourseDetailPage'
import { ProgramsPage } from '@/pages/ProgramsPage'
import { ProgramDetailPage } from '@/pages/ProgramDetailPage'
import { ScholarshipsPage } from '@/pages/ScholarshipsPage'
import { ScholarshipDetailPage } from '@/pages/ScholarshipDetailPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { NotificationPostPage } from '@/pages/NotificationPostPage'
import { CampusLifePage } from '@/pages/CampusLifePage'
import { CommunityPage } from '@/pages/CommunityPage'
import { CampusGuidePage } from '@/pages/CampusGuidePage'
import { CampusMapPage } from '@/pages/CampusMapPage'
import { OneStopGuidePage } from '@/pages/OneStopGuidePage'
import { CommunityNoticesPage } from '@/pages/CommunityNoticesPage'
import { CareerOpportunitiesPage } from '@/pages/CareerOpportunitiesPage'
import { SupportPage } from '@/pages/SupportPage'
import { EmergencySupportPage } from '@/pages/EmergencySupportPage'
import { WorkPermitPage } from '@/pages/WorkPermitPage'
import { RelatedLawsPage } from '@/pages/RelatedLawsPage'

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
        <Route path="academic/recommended-courses" element={<RecommendedCoursesPage />} />
        <Route path="academic/recommended-courses/:courseId" element={<CourseDetailPage />} />
        <Route path="academic/programs" element={<ProgramsPage />} />
        <Route path="academic/programs/:programId" element={<ProgramDetailPage />} />
        <Route path="academic/scholarships" element={<ScholarshipsPage />} />
        <Route path="academic/scholarships/:scholarshipId" element={<ScholarshipDetailPage />} />
        <Route path="campus-life" element={<CampusLifePage />} />
        <Route path="campus-life/one-stop" element={<OneStopGuidePage />} />
        <Route
          path="campus-life/library"
          element={<CampusGuidePage titleKey="campusLife.libraryGuide" bodyKey="campusLife.libraryBody" />}
        />
        <Route
          path="campus-life/cafeteria"
          element={
            <CampusGuidePage
              titleKey="campusLife.cafeteriaInfo"
              bodyKey="campusLife.cafeteriaBody"
              facilitiesMode="cafeteria"
            />
          }
        />
        <Route path="campus-life/map" element={<CampusMapPage />} />
        <Route path="career-opportunities" element={<CareerOpportunitiesPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route
          path="community/country-notices"
          element={
            <CommunityNoticesPage
              titleKey="community.countryNotices"
              descriptionKey="community.countryBody"
            />
          }
        />
        <Route
          path="community/department-notices"
          element={
            <CommunityNoticesPage
              titleKey="community.departmentNotices"
              descriptionKey="community.departmentBody"
            />
          }
        />
        <Route path="support" element={<SupportPage />} />
        <Route path="support/emergency" element={<EmergencySupportPage />} />
        <Route path="support/work-permit" element={<WorkPermitPage />} />
        <Route path="support/related-laws" element={<RelatedLawsPage />} />
        <Route path="my" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="notifications/:notificationId" element={<NotificationPostPage />} />
        <Route path="courses" element={<Navigate to="/academic" replace />} />
        <Route path="checklist" element={<Navigate to="/" replace />} />
        <Route path="chat" element={<Navigate to="/" replace />} />
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
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
