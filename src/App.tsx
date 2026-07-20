import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import type { ReactElement } from 'react'
import AppLayout from './layout/AppLayout'
import LoginPage from './pages/LoginPage'
import { isAuthenticated } from './lib/auth'
import DashboardPage from './pages/DashboardPage'
import TopicMiningPage from './pages/TopicMiningPage'
import ScriptCreationPage from './pages/ScriptCreationPage'
import VideoGenerationPage from './pages/VideoGenerationPage'
import VoiceClonePage from './pages/VoiceClonePage'
import DigitalHumanPage from './pages/DigitalHumanPage'
import CourseWorkshopPage from './pages/CourseWorkshopPage'
import FinalPreviewPage from './pages/FinalPreviewPage'
import PublishPage from './pages/PublishPage'
import MaterialManagementPage from './pages/MaterialManagementPage'
import ImagePublishPage from './pages/ImagePublishPage'
import DraftBoxPage from './pages/DraftBoxPage'
import PublishHistoryPage from './pages/PublishHistoryPage'
import AccountPage from './pages/AccountPage'
import BillingPage from './pages/BillingPage'

// 路由守衛：未登錄訪問受保護頁面時，重定向到登錄頁並記錄來源
function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

function App() {
  return (
    <Routes>
      {/* 已登錄用戶訪問登錄頁時，直接跳轉到首頁 */}
      <Route
        path="/login"
        element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      {/* 受保護的應用主體：每次訪問都需先經過登錄驗證 */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="topic-mining" element={<TopicMiningPage />} />
        <Route path="script-creation" element={<ScriptCreationPage />} />
        <Route path="video-generation" element={<VideoGenerationPage />} />
        <Route path="voice-clone" element={<VoiceClonePage />} />
        <Route path="digital-human" element={<DigitalHumanPage />} />
        <Route path="course-workshop" element={<CourseWorkshopPage />} />
        <Route path="final-preview" element={<FinalPreviewPage />} />
        {/* 發布與營運 */}
        <Route path="material-management" element={<MaterialManagementPage />} />
        <Route path="publish" element={<PublishPage />} />
        <Route path="image-publish" element={<ImagePublishPage />} />
        <Route path="draft-box" element={<DraftBoxPage />} />
        <Route path="publish-history" element={<PublishHistoryPage />} />
        {/* 賬號與費用 */}
        <Route path="account" element={<AccountPage />} />
        <Route path="billing" element={<BillingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
