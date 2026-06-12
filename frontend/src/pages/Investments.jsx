import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Header from "../components/layout/Header"
import {
  TrendingUp,
  LayoutDashboard,
  Briefcase,
  MessageCircle,
  MoreHorizontal,
  Calculator,
  Loader2,
} from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Research", icon: TrendingUp, path: "/research" },
  { label: "Portfolio", icon: Briefcase, path: "/portfolio" },
  { label: "Chat", icon: MessageCircle, path: "/chat" },
  { label: "More", icon: MoreHorizontal, path: "/more" },
]

function BottomNav({ active = "More" }) {
  const navigate = useNavigate()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t-2 border-[#1f2937] bg-[#111827]/95 backdrop-blur-md">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.label === active
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 transition-colors ${
                isActive ? "text-blue-500" : "text-gray-500 hover:text-gray-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default function InvestmentsPage() {
  const [monthlyAmount, setMonthlyAmount] = useState(2000)
  const [years, setYears] = useState(10)
  const [returnRate, setReturnRate] = useState(12)
  const [sipResult, setSipResult] = useState(null)
  const [sipLoading, setSipLoading] = useState(false)

  const [budget, setBudget] = useState(5000)
  const [riskLevel, setRiskLevel] = useState("medium")
  const [stockRecs, setStockRecs] = useState(null)
  const [sipRecs, setSipRecs] = useState(null)
  const [recsLoading, setRecsLoading] = useState(false)

  const calculateSIP = async () => {
    setSipLoading(true)
    try {
      const res = await axios.get(
        `${API_URL}/recommend/sip/calculate`,
        { params: { monthly_amount: monthlyAmount, annual_return: returnRate, years } }
      )
      setSipResult(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setSipLoading(false)
    }
  }

  const getRecommendations = async () => {
    setRecsLoading(true)
    try {
      const [stockRes, sipRes] = await Promise.all([
        axios.get(`${API_URL}/recommend/stocks`, {
          params: { budget, risk_level: riskLevel }
        }),
        axios.get(`${API_URL}/recommend/sips`, {
          params: { monthly_budget: monthlyAmount, risk_level: riskLevel, investment_years: years }
        }),
      ])
      setStockRecs(stockRes.data)
      setSipRecs(sipRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setRecsLoading(false)
    }
  }

  const formatCurrency = (num) => {
    if (!num) return "₹0"
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`
    return `₹${num.toLocaleString("en-IN")}`
  }

  const investedAmount = monthlyAmount * years * 12
  const projectedValue = sipResult?.results?.future_value || 0
  const progressPercent = projectedValue > 0
    ? Math.min((investedAmount / projectedValue) * 100, 100)
    : 50

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#0a0f1e] text-gray-50">
      <Header title="Investments" />
      <div className="flex flex-col gap-5 px-4 pb-28 pt-4">

        {/* SIP Calculator */}
        <section className="relative overflow-hidden rounded-2xl border border-[#1f2937] bg-[#111827] p-5">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-blue-500/60 to-emerald-500" />
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-4 w-4 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-50">SIP Calculator</h2>
          </div>

          {/* Monthly Amount */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500">Monthly Amount</label>
              <span className="font-mono text-sm font-semibold text-gray-50">
                ₹{monthlyAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <input
              type="range" min="500" max="100000" step="500"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>₹500</span><span>₹1L</span>
            </div>
          </div>

          {/* Duration */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500">Duration</label>
              <span className="font-mono text-sm font-semibold text-gray-50">{years} years</span>
            </div>
            <input
              type="range" min="1" max="30" step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>1 yr</span><span>30 yrs</span>
            </div>
          </div>

          {/* Return Rate */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500">Expected Return</label>
              <span className="font-mono text-sm font-semibold text-gray-50">{returnRate}% p.a.</span>
            </div>
            <input
              type="range" min="6" max="24" step="0.5"
              value={returnRate}
              onChange={(e) => setReturnRate(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>6%</span><span>24%</span>
            </div>
          </div>

          {/* Result */}
          {sipResult && (
            <div className="mb-4 rounded-xl border border-[#1f2937] bg-[#0a0f1e] p-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">You Invest</p>
                  <p className="font-mono text-lg font-semibold text-gray-50">
                    {formatCurrency(sipResult.results.total_invested)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">You Get</p>
                  <p className="font-mono text-lg font-semibold text-emerald-500">
                    {formatCurrency(sipResult.results.future_value)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Profit</p>
                  <p className="font-mono text-lg font-semibold text-emerald-500">
                    {formatCurrency(sipResult.results.wealth_gained)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Returns</p>
                  <p className="font-mono text-lg font-semibold text-emerald-500">
                    +{sipResult.results.absolute_returns}%
                  </p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                  <span>Invested</span>
                  <span>Returns</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#1f2937] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={calculateSIP}
            disabled={sipLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {sipLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            {sipLoading ? "Calculating..." : "Calculate Returns"}
          </button>
        </section>

        {/* Recommendations */}
        <section className="rounded-2xl border border-[#1f2937] bg-[#111827] p-5">
          <h2 className="text-lg font-bold text-gray-50 mb-4">Investment Recommendations</h2>

          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">Available Budget (₹)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full rounded-xl border border-[#1f2937] bg-[#0a0f1e] px-4 py-3 text-sm text-gray-50 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-2 block">Risk Appetite</label>
            <div className="flex gap-2">
              {["low", "medium", "high"].map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskLevel(level)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold capitalize transition-colors ${
                    riskLevel === level
                      ? level === "low" ? "bg-emerald-500 text-white"
                        : level === "medium" ? "bg-blue-500 text-white"
                        : "bg-amber-500 text-white"
                      : "border border-[#1f2937] text-gray-500"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={getRecommendations}
            disabled={recsLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 mb-4"
          >
            {recsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            {recsLoading ? "Finding best picks..." : "Get Recommendations"}
          </button>

          {/* Stock Recommendations */}
          {stockRecs && stockRecs.recommendations?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-50 mb-2">
                Top Stocks for ₹{budget.toLocaleString("en-IN")}
              </h3>
              <div className="overflow-hidden rounded-xl border border-[#1f2937]">
                {stockRecs.recommendations.map((stock, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-[#1f2937] ${i !== 0 ? "border-t border-[#1f2937]" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-bold text-gray-50">{stock.symbol}</p>
                        <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                          stock.signal === "BUY" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"
                        }`}>
                          {stock.signal}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {stock.shares_possible} shares · Score {stock.score}/100
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-medium text-gray-50">
                        ₹{stock.current_price?.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-gray-500">PE: {stock.pe_ratio?.toFixed(1) || "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIP Recommendations */}
          {sipRecs && sipRecs.recommendations?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-50 mb-2">
                Best SIPs for ₹{monthlyAmount.toLocaleString("en-IN")}/month
              </h3>
              <div className="overflow-hidden rounded-xl border border-[#1f2937]">
                {sipRecs.recommendations.slice(0, 3).map((fund, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3 hover:bg-[#1f2937] ${i !== 0 ? "border-t border-[#1f2937]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-50 leading-tight">{fund.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{fund.category} · {fund.risk} risk</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-sm font-semibold text-emerald-500">{fund.returns_3yr}%</p>
                        <p className="text-[10px] text-gray-500">3yr returns</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {years}yr projection:{" "}
                      <span className="font-mono text-emerald-400">
                        {formatCurrency(fund.projection?.expected_value)}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stockRecs && stockRecs.recommendations?.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-4">
              No stocks found within ₹{budget.toLocaleString("en-IN")} budget. Try increasing your budget.
            </p>
          )}
        </section>

      </div>
      <BottomNav active="More" />
    </main>
  )
}