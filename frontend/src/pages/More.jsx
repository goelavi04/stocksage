import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Header from "../components/layout/Header"
import {
  TrendingUp,
  LayoutDashboard,
  Briefcase,
  MessageCircle,
  MoreHorizontal,
  Newspaper,
  Info,
  ExternalLink,
  RefreshCw,
  Bell,
  Calculator,
} from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Research", icon: TrendingUp, path: "/research" },
  { label: "Portfolio", icon: Briefcase, path: "/portfolio" },
  { label: "Chat", icon: MessageCircle, path: "/chat" },
  { label: "More", icon: MoreHorizontal, path: "/more" },
]

const SENTIMENT_STYLES = {
  positive: "bg-emerald-500/15 text-emerald-500",
  negative: "bg-red-500/15 text-red-500",
  neutral: "bg-[#1f2937] text-gray-500",
}

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

export default function MorePage() {
  const [news, setNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const navigate = useNavigate()

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    setNewsLoading(true)
    try {
      const res = await axios.get(`${API_URL}/news/market`)
      setNews(res.data.articles || [])
    } catch (e) {
      console.error(e)
    } finally {
      setNewsLoading(false)
    }
  }

  const filteredNews = news.filter((n) => {
    if (filter === "positive") return n.sentiment === "positive"
    if (filter === "negative") return n.sentiment === "negative"
    return true
  })

  const positiveCount = news.filter((n) => n.sentiment === "positive").length
  const negativeCount = news.filter((n) => n.sentiment === "negative").length
  const neutralCount = news.filter((n) => n.sentiment === "neutral").length

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#0a0f1e] text-gray-50">
      <Header title="Market" />
      <div className="flex flex-col gap-5 px-4 pb-28 pt-4">

        {/* Quick Links */}
        <section className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Alerts",
              desc: "View portfolio alerts",
              path: "/alerts",
              icon: Bell,
              color: "bg-red-500/15 text-red-500",
            },
            {
              label: "Investments",
              desc: "SIP calculator & picks",
              path: "/investments",
              icon: Calculator,
              color: "bg-emerald-500/15 text-emerald-500",
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="rounded-2xl border border-[#1f2937] bg-[#111827] p-4 text-left hover:bg-[#1f2937] transition-colors"
              >
                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-gray-50">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </button>
            )
          })}
        </section>

        {/* Market Sentiment Summary */}
        {news.length > 0 && (
          <section className="rounded-2xl border border-[#1f2937] bg-[#111827] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Newspaper className="h-4 w-4 text-blue-500" />
              <h2 className="text-base font-bold text-gray-50">Market Sentiment</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                <p className="font-mono text-2xl font-bold text-emerald-500">{positiveCount}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Positive</p>
              </div>
              <div className="rounded-xl bg-red-500/10 p-3 text-center">
                <p className="font-mono text-2xl font-bold text-red-500">{negativeCount}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Negative</p>
              </div>
              <div className="rounded-xl bg-[#1f2937] p-3 text-center">
                <p className="font-mono text-2xl font-bold text-gray-400">{neutralCount}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Neutral</p>
              </div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-[#1f2937] overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${(positiveCount / news.length) * 100}%` }}
              />
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${(negativeCount / news.length) * 100}%` }}
              />
            </div>
          </section>
        )}

        {/* News Feed */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-50">Market News</h2>
            <button
              onClick={fetchNews}
              className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            {["all", "positive", "negative"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-blue-500 text-white"
                    : "border border-[#1f2937] text-gray-500"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {newsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#111827]" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#1f2937] bg-[#111827]">
              {filteredNews.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500">No news found</p>
              ) : (
                filteredNews.map((item, i) => {
                  const sentimentClass = SENTIMENT_STYLES[item.sentiment] || "bg-[#1f2937] text-gray-500"
                  const borderClass = i !== 0 ? "border-t border-[#1f2937]" : ""
                  return (
                    <div
                      key={i}
                      onClick={() => item.link && window.open(item.link, "_blank")}
                      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-[#1f2937] transition-colors cursor-pointer ${borderClass}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-50 leading-snug line-clamp-2">
                          {item.title}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-xs text-gray-500 capitalize">
                            {item.source?.replace(/_/g, " ")}
                          </span>
                          <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${sentimentClass}`}>
                            {item.sentiment?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-500 mt-1" />
                    </div>
                  )
                })
              )}
            </div>
          )}
        </section>

        {/* About */}
        <section className="rounded-2xl border border-[#1f2937] bg-[#111827] p-4">
          <div className="flex items-center gap-3 mb-3">
            <img src="/icon-192.png" alt="StockSage" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <h2 className="text-base font-bold text-gray-50">StockSage</h2>
              <p className="text-[10px] text-gray-500 tracking-widest">AI · INVEST · LEARN</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Version", value: "2.0.0" },
              { label: "AI Engine", value: "Groq Llama 3.3" },
              { label: "Sentiment", value: "FinBERT" },
              { label: "Data Source", value: "NSE / yfinance" },
              { label: "Built by", value: "Aviral Goel" },
              { label: "Institution", value: "KJ Somaiya" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="font-mono text-sm text-gray-300">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
      <BottomNav active="More" />
    </main>
  )
}