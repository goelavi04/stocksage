import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './pages/Dashboard'
import ResearchPage from './pages/Research'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/research" element={<ResearchPage />} />
      <Route path="/portfolio" element={<div className="text-white p-4">Portfolio</div>} />
      <Route path="/chat" element={<div className="text-white p-4">Chat</div>} />
      <Route path="/investments" element={<div className="text-white p-4">Investments</div>} />
      <Route path="/alerts" element={<div className="text-white p-4">Alerts</div>} />
    </Routes>
  )
}

export default App