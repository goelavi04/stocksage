import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Header from "../components/layout/Header"
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  Plus,
  CalendarPlus,
  BellRing,
  LayoutDashboard,
  LineChart,
  Briefcase,
  MessageCircle,
  MoreHorizontal,
  Loader2,
} from "lucide-react"

const INDICES = [
  { name: "NIFTY 50", value: "24,500", change: "+0.32%", positive: true },
  { name: "SENSEX", value: "80,200", change: "+0.28%", positive: true },
  { name: "BANK NIFTY", value: "52,100", change: "-0.15%", positive: false },
  { name: "GOLD", value: "71,200", change: "+0.45%", positive: true },
]

const SIGNAL_STYLES = {
  WATCH: "bg-amber-500/15 text-amber-500",
  BUY: "bg-emerald-500/15 text-emerald-500",
  "STRONG BUY": "bg-emerald-500/15 text-emerald-500",
  HOLD: "bg-blue-500/15 text-blue-500",
  "SELL / AVOID": "bg-red-500/15 text-red-500",
}

const SENTIMENT_STYLES = {
  positive: "bg-emerald-500/15 text-emerald-500",
  negative: "bg-red-500/15 text-red-500",
  neutral: "bg-[#1f2937] text-gray-500",
}

const NAV_TABS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Research", icon: LineChart, path: "/research" },
  { label: "Portfolio", icon: Briefcase, path: "/portfolio" },
  { label: "Chat", icon: MessageCircle, path: "/chat" },
  { label: "More", icon: MoreHorizontal, path: "/more" },
]

function BottomNav() {
  const navigate = useNavigate()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t-2 border-[#1f2937] bg-[#111827]/95 backdrop-blur-md">
      <div className="grid grid-cols-5">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.path === "/dashboard"
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                isActive ? "text-blue-500" : "text-gray-500 hover:text-gray-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [briefingOpen, setBriefingOpen] = useState(true)
  const [portfolio, setPortfolio] = useState(null)
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [briefing, setBriefing] = useState("")
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [news, setNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)

  useEffect(() => {
    fetchPortfolio()
    fetchNews()
  }, [])

  const fetchPortfolio = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/portfolio/")
      setPortfolio(res.data)
    } catch (e) {
      console.error("Portfolio fetch error:", e)
    } finally {
      setPortfolioLoading(false)
    }
  }

  const fetchNews = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/news/market")
      setNews(res.data.articles?.slice(0, 3) || [])
    } catch (e) {
      console.error("News fetch error:", e)
    } finally {
      setNewsLoading(false)
    }
  }

  const fetchBriefing = async () => {
    setBriefingLoading(true)
    try {
      const res = await axios.get("http://127.0.0.1:8000/chat/briefing?father_mode=false")
      setBriefing(res.data.briefing || res.data.message)
    } catch (e) {
      console.error("Briefing fetch error:", e)
      setBriefing("Unable to load AI briefing. Please check your backend connection.")
    } finally {
      setBriefingLoading(false)
    }
  }

  const summary = portfolio?.summary
  const holdings = portfolio?.holdings || []

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-gray-50">
      <div className="mx-auto max-w-md pb-24">
        <Header />
        <main className="space-y-5 px-4 py-5">

          {/* Portfolio Summary */}
          {portfolioLoading ? (
            <div className="h-44 animate-pulse rounded-2xl bg-[#111827]" />
          ) : summary ? (
            <section className="relative overflow-hidden rounded-2xl border border-[#1f2937] bg-[#111827] p-5">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-blue-500/40 to-emerald-500" />
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total Portfolio Value
                </p>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              </div>
              <p className="mt-1.5 font-mono text-4xl font-semibold tracking-tight text-gray-50">
                ₹{summary.current_value?.toLocaleString("en-IN")}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Invested</p>
                  <p className="mt-1 font-mono text-lg font-medium text-gray-50">
                    ₹{summary.total_invested?.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Returns</p>
                  <p className={`mt-1 font-mono text-lg font-medium ${summary.total_pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {summary.total_pnl >= 0 ? "+" : ""}₹{summary.total_pnl?.toLocaleString("en-IN")}
                  </p>
                  <p className={`font-mono text-xs ${summary.total_pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    ({summary.total_pnl_percent}%)
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#1f2937] pt-3">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Monthly SIP</span>
                <span className="font-mono text-sm font-medium text-blue-400">
                  ₹{summary.total_sip_monthly?.toLocaleString("en-IN") || 0}/mo
                </span>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-[#1f2937] bg-[#111827] p-5 text-center">
              <p className="text-sm text-gray-500">No portfolio data found</p>
              <button
                onClick={() => navigate("/portfolio")}
                className="mt-3 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white"
              >
                Add your first stock
              </button>
            </section>
          )}

          {/* Market Status Bar */}
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-2.5">
              {INDICES.map((index) => (
                <div
                  key={index.name}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-[#1f2937] bg-[#1f2937] px-3.5 py-2.5"
                >
                  <span className="text-xs font-medium text-gray-500">{index.name}</span>
                  <span className="font-mono text-sm font-medium text-gray-50">{index.value}</span>
                  <span className={`font-mono text-xs font-medium ${index.positive ? "text-emerald-500" : "text-red-500"}`}>
                    {index.change}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Holdings */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-50">Holdings</h2>
              <button
                onClick={() => navigate("/portfolio")}
                className="text-xs text-blue-500 hover:underline"
              >
                View all
              </button>
            </div>
            {holdings.length === 0 ? (
              <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-6 text-center">
                <p className="text-sm text-gray-500">No holdings yet</p>
                <button
                  onClick={() => navigate("/portfolio")}
                  className="mt-3 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white"
                >
                  Add Stock
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#1f2937] bg-[#111827]">
                {holdings.slice(0, 3).map((h, i) => (
                  <button
                    key={h.id}
                    onClick={() => navigate("/portfolio")}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#1f2937] ${
                      i !== 0 ? "border-t border-[#1f2937]" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-50">{h.symbol}</p>
                      <p className="truncate text-xs text-gray-500">{h.company_name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-medium text-gray-50">
                        ₹{h.current_price?.toLocaleString("en-IN")}
                      </p>
                      <p className={`font-mono text-xs font-medium ${h.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {h.pnl >= 0 ? "+" : ""}₹{h.pnl} ({h.pnl_percent}%)
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* AI Briefing */}
          <section className="overflow-hidden rounded-2xl border border-l-[3px] border-[#1f2937] border-l-blue-500 bg-[#111827]">
            <button
              onClick={() => {
                setBriefingOpen((v) => !v)
                if (!briefing && !briefingLoading) fetchBriefing()
              }}
              className="flex w-full items-center gap-2 px-4 py-3.5 text-left"
            >
              <h2 className="text-base font-bold text-gray-50">AI Briefing</h2>
              <span className="rounded-md bg-[#1f2937] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Today
              </span>
              <ChevronDown className={`ml-auto h-4 w-4 text-gray-500 transition-transform ${briefingOpen ? "rotate-180" : ""}`} />
            </button>
            {briefingOpen && (
              <div className="px-4 pb-4">
                {briefingLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    Generating briefing...
                  </div>
                ) : briefing ? (
                  <p className="text-sm leading-relaxed text-gray-400">{briefing}</p>
                ) : (
                  <button
                    onClick={fetchBriefing}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    Load AI briefing
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Add Stock", icon: Plus, action: () => navigate("/portfolio") },
              { label: "Add SIP", icon: CalendarPlus, action: () => navigate("/portfolio") },
              { label: "Check Alerts", icon: BellRing, action: () => navigate("/alerts") },
            ].map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  onClick={action.action}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-blue-500 bg-transparent px-2 py-3 text-gray-50 transition-colors hover:bg-blue-500/10"
                >
                  <Icon className="h-5 w-5 text-blue-500" />
                  <span className="text-xs font-medium">{action.label}</span>
                </button>
              )
            })}
          </div>

          {/* Market News */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-50">Market News</h2>
              <button
                onClick={() => navigate("/more")}
                className="text-xs text-blue-500 hover:underline"
              >
                View all
              </button>
            </div>
            {newsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#111827]" />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#1f2937] bg-[#111827]">
                {news.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-gray-500">No news available</p>
                ) : (
                  news.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#1f2937] ${
                        i !== 0 ? "border-t border-[#1f2937]" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-50">{item.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-gray-500">{item.source}</span>
                          <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                            SENTIMENT_STYLES[item.sentiment] || "bg-[#1f2937] text-gray-500"
                          }`}>
                            {item.sentiment?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

        </main>
        <BottomNav />
      </div>
    </div>
  )
}