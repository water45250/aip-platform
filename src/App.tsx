import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TopicMiningPage from './pages/TopicMiningPage'
import ScriptCreationPage from './pages/ScriptCreationPage'
import VideoGenerationPage from './pages/VideoGenerationPage'
import VoiceClonePage from './pages/VoiceClonePage'
import DigitalHumanPage from './pages/DigitalHumanPage'
import SmartEditingPage from './pages/SmartEditingPage'
import FinalPreviewPage from './pages/FinalPreviewPage'
import PublishPage from './pages/PublishPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AccountPage from './pages/AccountPage'
import BillingPage from './pages/BillingPage'
import PlaceholderPage from './pages/PlaceholderPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="topic-mining" element={<TopicMiningPage />} />
        <Route path="script-creation" element={<ScriptCreationPage />} />
        <Route path="video-generation" element={<VideoGenerationPage />} />
        <Route path="voice-clone" element={<VoiceClonePage />} />
        <Route path="digital-human" element={<DigitalHumanPage />} />
        <Route path="smart-editing" element={<SmartEditingPage />} />
        <Route path="final-preview" element={<FinalPreviewPage />} />
        <Route path="publish" element={<PublishPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="mentor" element={<PlaceholderPage title="導師審核" />} />
        <Route path="templates" element={<PlaceholderPage title="模板中心" />} />
        <Route path="assets" element={<PlaceholderPage title="素材中心" />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
