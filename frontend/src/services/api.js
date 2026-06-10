import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 30000,
})

export const stockAPI = {
  getQuote: (symbol) => api.get(`/stock/quote/${symbol}`),
  getHistory: (symbol, period) => api.get(`/stock/history/${symbol}`, { params: { period } }),
  getIndicators: (symbol) => api.get(`/stock/indicators/${symbol}`),
  getFundamentals: (symbol) => api.get(`/stock/fundamentals/${symbol}`),
  getRecommendation: (symbol) => api.get(`/stock/recommendation/${symbol}`),
}

export const portfolioAPI = {
  getPortfolio: () => api.get('/portfolio'),
  addHolding: (data) => api.post('/portfolio/holding', data),
  deleteHolding: (id) => api.delete(`/portfolio/holding/${id}`),
  addSIP: (data) => api.post('/portfolio/sip', data),
  deleteSIP: (id) => api.delete(`/portfolio/sip/${id}`),
  analysePortfolio: () => api.get('/portfolio/analyse'),
}

export const newsAPI = {
  getMarketNews: () => api.get('/news/market'),
  getStockNews: (symbol) => api.get(`/news/stock/${symbol}`),
  getPortfolioNews: (symbols) => api.get('/news/portfolio', { params: { symbols } }),
}

export const alertAPI = {
  checkAlerts: () => api.get('/alerts/check'),
  getMarketStatus: () => api.get('/alerts/market-status'),
  getNotifications: (unreadOnly) => api.get('/notifications', { params: { unread_only: unreadOnly } }),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  clearAll: () => api.delete('/notifications'),
}

export const recommendAPI = {
  calculateSIP: (params) => api.post('/recommend/sip/calculate', params),
  analyseSIP: (params) => api.post('/recommend/sip/analyse', params),
  getStockRecommendations: (budget, riskLevel) =>
    api.get('/recommend/stocks', { params: { budget, risk_level: riskLevel } }),
  getSIPRecommendations: (monthlyBudget, riskLevel, years) =>
    api.get('/recommend/sip', { params: { monthly_budget: monthlyBudget, risk_level: riskLevel, years } }),
  getETFRecommendations: (budget, goal) =>
    api.get('/recommend/etf', { params: { budget, goal } }),
  getCompleteRecommendation: (params) => api.post('/recommend/complete', params),
}

export const chatAPI = {
  sendMessage: (message, fatherMode, history) =>
    api.post('/chat/message', { message, father_mode: fatherMode, history }),
  getDailyBriefing: (fatherMode) =>
    api.get('/chat/briefing', { params: { father_mode: fatherMode } }),
  analyseStock: (symbol) => api.get(`/chat/analyse/${symbol}`),
  quickAsk: (question, fatherMode) =>
    api.post('/chat/quick', { question, father_mode: fatherMode }),
}

export default api
