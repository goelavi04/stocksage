import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './pages/Dashboard'
import ResearchPage from './pages/Research'
import PortfolioPage from './pages/Portfolio'
import ChatPage from './pages/Chat'
import InvestmentsPage from './pages/Investments'
import AlertsPage from './pages/Alerts'
import MorePage from './pages/More'
import ProfilesPage from './pages/Profiles'

function RootRedirect() {
  const uid = localStorage.getItem("ss_uid")
  return <Navigate to={uid ? "/dashboard" : "/profiles"} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/profiles" element={<ProfilesPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/research" element={<ResearchPage />} />
      <Route path="/portfolio" element={<PortfolioPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/investments" element={<InvestmentsPage />} />
      <Route path="/alerts" element={<AlertsPage />} />
      <Route path="/more" element={<MorePage />} />
    </Routes>
  )
}

export default App
