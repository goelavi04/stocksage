import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './pages/Dashboard'
import ResearchPage from './pages/Research'
import PortfolioPage from './pages/Portfolio'
import ChatPage from './pages/Chat'
import InvestmentsPage from './pages/Investments'
import AlertsPage from './pages/Alerts'
import MorePage from './pages/More'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
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