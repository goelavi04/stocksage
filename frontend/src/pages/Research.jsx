import { useState, useEffect, useRef } from "react"
import { createChart, LineSeries } from "lightweight-charts"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Header from "../components/layout/Header"
import {

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
  Search,
  X,
  LineChart,
  Sparkles,
  Loader2,
  ChevronRight,
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react"

const RECENT_SEARCHES = ["TCS", "RELIANCE", "HDFCBANK", "INFY"]
const PERIODS = ["1D", "1W", "1M", "3M", "1Y", "5Y"]
const PERIOD_MAP = {
  "1D": "5d",
  "1W": "1mo",
  "1M": "1mo",
  "3M": "3mo",
  "1Y": "1y",
  "5Y": "5y",
}

const SIGNAL_STYLES = {
  "STRONG BUY": "bg-emerald-500/15 text-emerald-500",
  BUY: "bg-emerald-500/15 text-emerald-500",
  HOLD: "bg-blue-500/15 text-blue-500",
  WATCH: "bg-amber-500/15 text-amber-500",
  "SELL / AVOID": "bg-red-500/15 text-red-500",
}

const SENTIMENT_STYLES = {
  positive: "bg-emerald-500/15 text-emerald-500",
  negative: "bg-red-500/15 text-red-500",
  neutral: "bg-[#1f2937] text-gray-500",
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Research", icon: TrendingUp, path: "/research" },
  { label: "Portfolio", icon: Briefcase, path: "/portfolio" },
  { label: "Chat", icon: MessageCircle, path: "/chat" },
  { label: "More", icon: MoreHorizontal, path: "/more" },
]

function BottomNav({ active = "Research" }) {
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

function StockChart({ chartData, activePeriod, setActivePeriod }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || chartData.length === 0) return

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const container = containerRef.current
    const width = container.offsetWidth || 350

    const chart = createChart(container, {
      layout: { background: { color: "#0a0f1e" }, textColor: "#6B7280" },
      grid: { vertLines: { color: "#1f2937" }, horzLines: { color: "#1f2937" } },
      width,
      height: 200,
      timeScale: { borderColor: "#1f2937" },
      rightPriceScale: { borderColor: "#1f2937" },
      crosshair: { vertLine: { color: "#3B82F6" }, horzLine: { color: "#3B82F6" } },
      handleScroll: true,
      handleScale: true,
    })

    const series = chart.addSeries(LineSeries, { color: "#3B82F6", lineWidth: 2 })
    series.setData(chartData)
    chart.timeScale().fitContent()
    chartRef.current = chart

    const onResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.offsetWidth })
      }
    }
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [chartData])

  return (
    <section className="rounded-2xl border border-[#1f2937] bg-[#111827] p-4">
      <div className="flex items-center gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setActivePeriod(p)}
            className={`flex-1 rounded-lg py-1.5 font-mono text-xs font-semibold transition-colors ${
              activePeriod === p ? "bg-blue-500 text-gray-50" : "text-gray-500 hover:bg-[#1f2937] hover:text-gray-50"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="mt-3">
        {chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center gap-2 rounded-xl border border-[#1f2937] bg-[#0a0f1e] text-sm text-gray-500">
            <LineChart className="h-5 w-5" />
            Loading chart...
          </div>
        ) : (
          <div ref={containerRef} className="w-full rounded-xl overflow-hidden" style={{ height: "200px" }} />
        )}
      </div>
    </section>
  )
}

export default function ResearchPage() {
  const [query, setQuery] = useState("")
  const [activePeriod, setActivePeriod] = useState("1Y")
  const [symbol, setSymbol] = useState("TCS")
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])
  const [quote, setQuote] = useState(null)
  const [indicators, setIndicators] = useState(null)
  const [fundamentals, setFundamentals] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [news, setNews] = useState([])
  const [aiState, setAiState] = useState("idle")
  const [aiAnalysis, setAiAnalysis] = useState("")

  const fetchStockData = async (sym) => {
    setLoading(true)
    setAiState("idle")
    setAiAnalysis("")
    try {
      const [quoteRes, indRes, fundRes, recRes, newsRes] = await Promise.all([
        axios.get(`${API_URL}/stock/${sym}`),
        axios.get(`${API_URL}/stock/${sym}/indicators`),
        axios.get(`${API_URL}/stock/${sym}/fundamentals`),
        axios.get(`${API_URL}/stock/${sym}/recommend`),
        axios.get(`${API_URL}/news/stock/${sym}`),
      ])
      setQuote(quoteRes.data)
      setIndicators(indRes.data)
      setFundamentals(fundRes.data)
      setRecommendation(recRes.data)
      setNews(newsRes.data.articles?.slice(0, 3) || [])
    } catch (e) {
      console.error("Failed to fetch stock data:", e)
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async (sym, period) => {
    try {
      setChartData([])
      const res = await axios.get(
        `${API_URL}/stock/${sym}/history?period=${PERIOD_MAP[period]}`
      )
      const data = res.data.data.map((item) => ({ time: item.date, value: item.close }))
      setChartData(data)
    } catch (e) {
      console.error("Chart fetch error:", e)
    }
  }

  useEffect(() => {
    fetchStockData(symbol)
    fetchChartData(symbol, activePeriod)
  }, [])

  useEffect(() => {
    fetchChartData(symbol, activePeriod)
  }, [activePeriod])

  const handleSearch = (sym) => {
    const s = sym.trim().toUpperCase()
    if (!s) return
    setSymbol(s)
    setChartData([])
    setQuery("")
    fetchStockData(s)
    fetchChartData(s, activePeriod)
  }

  const generateAnalysis = async () => {
    setAiState("loading")
    try {
      const res = await axios.get(`${API_URL}/chat/analyse/${symbol}`, { timeout: 60000 })
      setAiAnalysis(res.data.analysis)
      setAiState("done")
    } catch (error) {
      setAiAnalysis("Failed to generate analysis. Please try again.")
      setAiState("done")
    }
  }

  const signal = recommendation?.recommendation?.signal
  const rsi = indicators?.indicators?.rsi
  const ma = indicators?.indicators?.moving_averages
  const macd = indicators?.indicators?.macd
  const bb = indicators?.indicators?.bollinger_bands
  const val = fundamentals?.valuation
  const prof = fundamentals?.profitability
  const health = fundamentals?.financial_health

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#0a0f1e] text-gray-50">
      <Header title="Research" />
      <div className="flex flex-col gap-5 px-4 pb-28 pt-4">

        {/* Search */}
        <section>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
              placeholder="Search NSE stocks... (TCS, RELIANCE)"
              className="w-full rounded-2xl border border-[#1f2937] bg-[#111827] py-3 pl-11 pr-11 text-sm text-gray-50 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 hover:text-gray-50">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Recent</span>
            {RECENT_SEARCHES.map((s) => (
              <button key={s} onClick={() => handleSearch(s)} className="rounded-full border border-[#1f2937] bg-[#111827] px-3 py-1 font-mono text-xs font-medium text-gray-50 hover:border-blue-500 hover:text-blue-500">
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Stock Header */}
        {loading ? (
          <div className="h-36 animate-pulse rounded-2xl bg-[#111827]" />
        ) : quote ? (
          <section className="relative overflow-hidden rounded-2xl border border-[#1f2937] bg-[#111827] p-4">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-blue-500/60 to-emerald-500" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-50">{symbol}</h1>
                  {signal && (
                    <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide ${SIGNAL_STYLES[signal] || "bg-gray-800 text-gray-500"}`}>
                      {signal}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-gray-500">{quote.company_name}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-2xl font-semibold text-gray-50">₹{quote.current_price?.toLocaleString("en-IN")}</p>
                <p className={`mt-0.5 font-mono text-sm ${quote.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {quote.change >= 0 ? "+" : ""}₹{quote.change} ({quote.percent_change}%)
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 border-t border-[#1f2937] pt-3">
              {[
                { label: "OPEN", value: `₹${quote.open}` },
                { label: "HIGH", value: `₹${quote.high}` },
                { label: "LOW", value: `₹${quote.low}` },
                { label: "VOLUME", value: Number(quote.volume)?.toLocaleString("en-IN") },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[11px] uppercase tracking-wider text-gray-500">{item.label}</p>
                  <p className="mt-0.5 font-mono text-xs font-medium text-gray-50">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Chart */}
        <StockChart chartData={chartData} activePeriod={activePeriod} setActivePeriod={setActivePeriod} />

        {/* Technical Indicators */}
        {indicators && (
          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-50">Technical Indicators</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-50">RSI (14)</p>
                  <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${rsi?.value < 35 ? "bg-emerald-500/15 text-emerald-500" : rsi?.value > 70 ? "bg-red-500/15 text-red-500" : "bg-[#1f2937] text-gray-500"}`}>
                    {rsi?.value < 35 ? "OVERSOLD" : rsi?.value > 70 ? "OVERBOUGHT" : "NEUTRAL"}
                  </span>
                </div>
                <p className="mt-2 font-mono text-2xl font-semibold text-gray-50">{rsi?.value}</p>
                <p className="mt-1 text-xs text-gray-500">{rsi?.signal}</p>
              </div>

              <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-50">Moving Avg</p>
                  <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${ma?.signal?.includes("Bullish") ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
                    {ma?.signal?.includes("Bullish") ? "BULLISH" : "BEARISH"}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-col gap-1.5">
                  {[{ label: "MA20", value: ma?.ma20 }, { label: "MA50", value: ma?.ma50 }, { label: "MA200", value: ma?.ma200 }].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <span className="font-mono text-xs font-medium text-gray-50">₹{item.value?.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-50">MACD</p>
                  <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${macd?.signal?.includes("Bullish") ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
                    {macd?.signal?.includes("Bullish") ? "BULLISH" : "BEARISH"}
                  </span>
                </div>
                <p className={`mt-2 font-mono text-2xl font-semibold ${macd?.macd >= 0 ? "text-emerald-500" : "text-red-500"}`}>{macd?.macd}</p>
                <p className="mt-1 font-mono text-xs text-gray-500">Signal: {macd?.signal_line}</p>
              </div>

              <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-50">Bollinger</p>
                  <span className="rounded-md bg-[#1f2937] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-500">
                    {bb?.signal?.includes("normal") ? "NORMAL" : bb?.signal?.includes("lower") ? "OVERSOLD" : "OVERBOUGHT"}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-col gap-1.5">
                  {[{ label: "Upper", value: bb?.upper }, { label: "Lower", value: bb?.lower }].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <span className="font-mono text-xs font-medium text-gray-50">₹{item.value?.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Fundamentals */}
        {fundamentals && (
          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-50">Fundamentals</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "PE Ratio", value: val?.pe_ratio, badge: val?.pe_signal, badgeClass: "bg-[#1f2937] text-gray-500" },
                { label: "EPS", value: prof?.eps, prefix: "₹" },
                { label: "ROE", value: prof?.roe, valueClass: "text-emerald-500" },
                { label: "Profit Margin", value: prof?.profit_margin },
                { label: "Debt/Equity", value: health?.debt_to_equity, badge: health?.debt_signal, badgeClass: "bg-emerald-500/15 text-emerald-500" },
                { label: "Market Cap", value: quote?.market_cap ? `₹${(quote.market_cap / 1e7).toFixed(2)}Cr` : "N/A" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#1f2937] bg-[#111827] p-4">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className={`mt-1.5 font-mono text-lg font-semibold ${item.valueClass || "text-gray-50"}`}>
                    {item.prefix || ""}{item.value || "N/A"}
                  </p>
                  {item.badge && (
                    <span className={`mt-2 inline-block rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI Analysis */}
        <section className="overflow-hidden rounded-2xl border border-l-[3px] border-[#1f2937] border-l-blue-500 bg-[#111827] p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-50">AI Analysis</h2>
            <span className="rounded-md bg-[#1f2937] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Powered by Groq</span>
          </div>
          {aiState === "idle" && (
            <button onClick={generateAnalysis} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-gray-50 hover:opacity-90">
              <Sparkles className="h-4 w-4" />
              Generate Analysis
            </button>
          )}
          {aiState === "loading" && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#1f2937] bg-[#0a0f1e] py-3 pl-4 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              Analyzing {symbol}...
            </div>
          )}
          {aiState === "done" && (
            <div>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">{aiAnalysis}</p>
              <button onClick={() => setAiState("idle")} className="mt-2 text-xs text-blue-500 hover:underline">Regenerate</button>
            </div>
          )}
        </section>

        {/* News */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-gray-50">Recent News</h2>
          <div className="overflow-hidden rounded-2xl border border-[#1f2937] bg-[#111827]">
            {news.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">No recent news found for {symbol}</p>
            ) : (
              news.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#1f2937] ${i !== 0 ? "border-t border-[#1f2937]" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-50">{item.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-500">{item.source}</span>
                      <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${SENTIMENT_STYLES[item.sentiment] || "bg-[#1f2937] text-gray-500"}`}>
                        {item.sentiment?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
                </div>
              ))
            )}
          </div>
        </section>

      </div>
      <BottomNav active="Research" />
    </main>
  )
}