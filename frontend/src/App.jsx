import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './pages/Dashboard'
import ResearchPage from './pages/Research'
import PortfolioPage from './pages/Portfolio'
import ChatPage from './pages/Chat'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/research" element={<ResearchPage />} />
      <Route path="/portfolio" element={<PortfolioPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/investments" element={<div className="min-h-screen bg-[#0a0f1e] text-white p-4">Investments</div>} />
      <Route path="/alerts" element={<div className="min-h-screen bg-[#0a0f1e] text-white p-4">Alerts</div>} />
      <Route path="/more" element={<div className="min-h-screen bg-[#0a0f1e] text-white p-4">More</div>} />
    </Routes>
  )
}

export default App