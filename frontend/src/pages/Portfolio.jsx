import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Header from "../components/layout/Header"
import {
  Plus,
  TrendingUp,
  LayoutDashboard,
  Briefcase,
  MessageCircle,
  MoreHorizontal,
  X,
  Loader2,
  Search,
} from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Research", icon: TrendingUp, path: "/research" },
  { label: "Portfolio", icon: Briefcase, path: "/portfolio" },
  { label: "Chat", icon: MessageCircle, path: "/chat" },
  { label: "More", icon: MoreHorizontal, path: "/more" },
]

const NSE_STOCKS = [
  { symbol: "RELIANCE", name: "Reliance Industries" },
  { symbol: "TCS", name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK", name: "HDFC Bank" },
  { symbol: "INFY", name: "Infosys" },
  { symbol: "ICICIBANK", name: "ICICI Bank" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever" },
  { symbol: "SBIN", name: "State Bank of India" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank" },
  { symbol: "LT", name: "Larsen & Toubro" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance" },
  { symbol: "WIPRO", name: "Wipro" },
  { symbol: "ASIANPAINT", name: "Asian Paints" },
  { symbol: "MARUTI", name: "Maruti Suzuki" },
  { symbol: "TITAN", name: "Titan Company" },
  { symbol: "AXISBANK", name: "Axis Bank" },
  { symbol: "NESTLEIND", name: "Nestle India" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical" },
  { symbol: "TATAMOTORS", name: "Tata Motors" },
  { symbol: "TATASTEEL", name: "Tata Steel" },
  { symbol: "TECHM", name: "Tech Mahindra" },
  { symbol: "NTPC", name: "NTPC" },
  { symbol: "POWERGRID", name: "Power Grid Corp" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement" },
  { symbol: "ITC", name: "ITC" },
  { symbol: "ONGC", name: "Oil & Natural Gas Corp" },
  { symbol: "JSWSTEEL", name: "JSW Steel" },
  { symbol: "HCLTECH", name: "HCL Technologies" },
  { symbol: "ADANIENT", name: "Adani Enterprises" },
  { symbol: "ADANIPORTS", name: "Adani Ports" },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv" },
  { symbol: "DIVISLAB", name: "Divi's Laboratories" },
  { symbol: "DRREDDY", name: "Dr Reddy's Laboratories" },
  { symbol: "EICHERMOT", name: "Eicher Motors" },
  { symbol: "GRASIM", name: "Grasim Industries" },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp" },
  { symbol: "HINDALCO", name: "Hindalco Industries" },
  { symbol: "INDUSINDBK", name: "IndusInd Bank" },
  { symbol: "CIPLA", name: "Cipla" },
  { symbol: "COALINDIA", name: "Coal India" },
  { symbol: "BPCL", name: "Bharat Petroleum" },
  { symbol: "IOC", name: "Indian Oil Corporation" },
  { symbol: "TATACONSUM", name: "Tata Consumer Products" },
  { symbol: "BRITANNIA", name: "Britannia Industries" },
  { symbol: "DABUR", name: "Dabur India" },
  { symbol: "GODREJCP", name: "Godrej Consumer Products" },
  { symbol: "PIDILITIND", name: "Pidilite Industries" },
  { symbol: "SIEMENS", name: "Siemens India" },
  { symbol: "ABB", name: "ABB India" },
  { symbol: "AMBUJACEM", name: "Ambuja Cements" },
  { symbol: "ACC", name: "ACC" },
  { symbol: "SHREECEM", name: "Shree Cement" },
  { symbol: "DMART", name: "Avenue Supermarts" },
  { symbol: "TRENT", name: "Trent" },
  { symbol: "NYKAA", name: "FSN E-Commerce (Nykaa)" },
  { symbol: "ZOMATO", name: "Eternal (Zomato)" },
  { symbol: "PAYTM", name: "One97 Communications (Paytm)" },
  { symbol: "IRCTC", name: "Indian Railway Catering" },
  { symbol: "IRFC", name: "Indian Railway Finance Corp" },
  { symbol: "JIOFIN", name: "Jio Financial Services" },
  { symbol: "IDEA", name: "Vodafone Idea" },
  { symbol: "YESBANK", name: "Yes Bank" },
  { symbol: "SUZLON", name: "Suzlon Energy" },
  { symbol: "NHPC", name: "NHPC" },
  { symbol: "RECLTD", name: "REC Limited" },
  { symbol: "PFC", name: "Power Finance Corporation" },
  { symbol: "BANKBARODA", name: "Bank of Baroda" },
  { symbol: "CANBK", name: "Canara Bank" },
  { symbol: "PNB", name: "Punjab National Bank" },
  { symbol: "FEDERALBNK", name: "Federal Bank" },
  { symbol: "IDFCFIRSTB", name: "IDFC First Bank" },
  { symbol: "BANDHANBNK", name: "Bandhan Bank" },
  { symbol: "AUBANK", name: "AU Small Finance Bank" },
  { symbol: "CHOLAFIN", name: "Cholamandalam Investment" },
  { symbol: "MUTHOOTFIN", name: "Muthoot Finance" },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance" },
  { symbol: "SBILIFE", name: "SBI Life Insurance" },
  { symbol: "LICI", name: "Life Insurance Corp of India" },
  { symbol: "NIFTYBEES", name: "Nippon Nifty BeES ETF" },
  { symbol: "GOLDBEES", name: "Nippon Gold BeES ETF" },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals" },
  { symbol: "TATAPOWER", name: "Tata Power" },
  { symbol: "ADANIGREEN", name: "Adani Green Energy" },
  { symbol: "OFSS", name: "Oracle Financial Services" },
  { symbol: "MPHASIS", name: "Mphasis" },
  { symbol: "LTIM", name: "LTIMindtree" },
  { symbol: "PERSISTENT", name: "Persistent Systems" },
  { symbol: "COFORGE", name: "Coforge" },
  { symbol: "TATACHEM", name: "Tata Chemicals" },
  { symbol: "UPL", name: "UPL" },
  { symbol: "PIIND", name: "PI Industries" },
  { symbol: "CANFINHOME", name: "Can Fin Homes" },
  { symbol: "LICHSGFIN", name: "LIC Housing Finance" },
]

const MUTUAL_FUNDS = [
  "Mirae Asset Large Cap Fund Direct Growth",
  "Axis Bluechip Fund Direct Growth",
  "HDFC Top 100 Fund Direct Growth",
  "SBI Blue Chip Fund Direct Growth",
  "Nippon India Large Cap Fund Direct Growth",
  "ICICI Prudential Bluechip Fund Direct Growth",
  "Kotak Bluechip Fund Direct Growth",
  "Canara Robeco Bluechip Equity Fund Direct Growth",
  "Kotak Emerging Equity Fund Direct Growth",
  "Edelweiss Mid Cap Fund Direct Growth",
  "Invesco India Mid Cap Fund Direct Growth",
  "HDFC Mid Cap Opportunities Fund Direct Growth",
  "Nippon India Growth Fund Direct Growth",
  "Axis Midcap Fund Direct Growth",
  "DSP Mid Cap Fund Direct Growth",
  "SBI Magnum Midcap Fund Direct Growth",
  "Motilal Oswal Midcap Fund Direct Growth",
  "Quant Small Cap Fund Direct Growth",
  "Axis Small Cap Fund Direct Growth",
  "Nippon India Small Cap Fund Direct Growth",
  "SBI Small Cap Fund Direct Growth",
  "HDFC Small Cap Fund Direct Growth",
  "Kotak Small Cap Fund Direct Growth",
  "Nippon India Multi Cap Fund Direct Growth",
  "Quant Active Fund Direct Growth",
  "HDFC Multi Cap Fund Direct Growth",
  "Parag Parikh Flexi Cap Fund Direct Growth",
  "Canara Robeco Flexi Cap Fund Direct Growth",
  "HDFC Flexi Cap Fund Direct Growth",
  "Kotak Flexicap Fund Direct Growth",
  "SBI Flexicap Fund Direct Growth",
  "UTI Flexi Cap Fund Direct Growth",
  "Mirae Asset Tax Saver Fund Direct Growth",
  "Axis Long Term Equity Fund Direct Growth",
  "Quant Tax Plan Direct Growth",
  "DSP Tax Saver Fund Direct Growth",
  "Kotak Tax Saver Fund Direct Growth",
  "HDFC Taxsaver Fund Direct Growth",
  "SBI Long Term Equity Fund Direct Growth",
  "UTI Nifty 50 Index Fund Direct Growth",
  "HDFC Index Fund Nifty 50 Plan Direct Growth",
  "Nippon India Index Fund Nifty 50 Direct Growth",
  "Motilal Oswal Nifty 50 Index Fund Direct Growth",
  "SBI Nifty Index Fund Direct Growth",
  "UTI Nifty Next 50 Index Fund Direct Growth",
  "Motilal Oswal S&P 500 Index Fund Direct Growth",
  "Tata Digital India Fund Direct Growth",
  "ICICI Prudential Technology Fund Direct Growth",
  "SBI Technology Opportunities Fund Direct Growth",
  "HDFC Banking and Financial Services Fund Direct Growth",
  "Nippon India Banking & Financial Services Fund Direct Growth",
  "Mirae Asset Healthcare Fund Direct Growth",
  "Nippon India Pharma Fund Direct Growth",
  "Nippon India Power & Infra Fund Direct Growth",
  "Tata Infrastructure Fund Direct Growth",
  "HDFC Balanced Advantage Fund Direct Growth",
  "ICICI Prudential Balanced Advantage Fund Direct Growth",
  "Kotak Balanced Advantage Fund Direct Growth",
  "Edelweiss Balanced Advantage Fund Direct Growth",
  "SBI Balanced Advantage Fund Direct Growth",
  "HDFC Hybrid Equity Fund Direct Growth",
  "SBI Equity Hybrid Fund Direct Growth",
  "Canara Robeco Equity Hybrid Fund Direct Growth",
  "Mirae Asset Hybrid Equity Fund Direct Growth",
  "Nippon India Gold Savings Fund Direct Growth",
  "HDFC Gold Fund Direct Growth",
  "SBI Gold Fund Direct Growth",
  "Kotak Gold Fund Direct Growth",
]

function BottomNav({ active = "Portfolio" }) {
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

function AddStockModal({ onClose, onAdd, userId }) {
  const [form, setForm] = useState({
    symbol: "",
    quantity: "",
    buy_price: "",
    buy_date: "",
    holding_type: "stock",
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSymbolChange = (value) => {
    setForm({ ...form, symbol: value.toUpperCase() })
    if (value.length >= 1) {
      const filtered = NSE_STOCKS.filter(
        (s) =>
          s.symbol.toLowerCase().includes(value.toLowerCase()) ||
          s.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectStock = (stock) => {
    setForm({ ...form, symbol: stock.symbol })
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleSubmit = async () => {
    if (!form.symbol || !form.quantity || !form.buy_price) return
    setLoading(true)
    try {
      await axios.post(`${API_URL}/portfolio/add`, {
        user_id: userId,
        symbol: form.symbol.toUpperCase(),
        quantity: parseFloat(form.quantity),
        buy_price: parseFloat(form.buy_price),
        buy_date: form.buy_date
          ? new Date(form.buy_date).toISOString().split("T")[0]
          : null,
        holding_type: form.holding_type,
        notes: form.notes || null,
      })
      onAdd()
      onClose()
    } catch (e) {
      console.error("Failed to add holding:", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl border-t border-[#1f2937] bg-[#111827] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-50">Add Stock</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f2937] text-gray-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <label className="text-xs text-gray-500 mb-1 block">Stock Symbol</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search stock name or symbol..."
                value={form.symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="w-full rounded-xl border border-[#1f2937] bg-[#0a0f1e] py-3 pl-10 pr-4 text-sm text-gray-50 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            {showSuggestions && (
              <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl border border-[#1f2937] bg-[#111827] overflow-hidden shadow-xl">
                {suggestions.map((stock, i) => (
                  <button
                    key={i}
                    onClick={() => selectStock(stock)}
                    className={`w-full px-4 py-2.5 text-left hover:bg-[#1f2937] ${i !== 0 ? "border-t border-[#1f2937]" : ""}`}
                  >
                    <span className="font-mono text-sm font-semibold text-gray-50">{stock.symbol}</span>
                    <span className="ml-2 text-xs text-gray-500">{stock.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
              <input
                type="number"
                placeholder="10"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full rounded-xl border border-[#1f2937] bg-[#0a0f1e] px-4 py-3 text-sm text-gray-50 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Buy Price (₹)</label>
              <input
                type="number"
                placeholder="3200"
                value={form.buy_price}
                onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
                className="w-full rounded-xl border border-[#1f2937] bg-[#0a0f1e] px-4 py-3 text-sm text-gray-50 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Buy Date</label>
            <input
              type="date"
              value={form.buy_date}
              onChange={(e) => setForm({ ...form, buy_date: e.target.value })}
              className="w-full rounded-xl border border-[#1f2937] bg-[#0a0f1e] px-4 py-3 text-sm text-gray-50 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Type</label>
            <div className="flex gap-2">
              {["stock", "etf"].map((type) => (
                <button
                  key={type}
                  onClick={() => setForm({ ...form, holding_type: type })}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium uppercase transition-colors ${
                    form.holding_type === type ? "bg-blue-500 text-white" : "border border-[#1f2937] text-gray-500"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. Long term investment"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-xl border border-[#1f2937] bg-[#0a0f1e] px-4 py-3 text-sm text-gray-50 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !form.symbol || !form.quantity || !form.buy_price}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Adding..." : "Add to Portfolio"}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddSIPModal({ onClose, onAdd, userId }) {
  const [form, setForm] = useState({
    fund_name: "",
    monthly_amount: "",
    start_date: "",
    sip_date: "1",
  })
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleFundNameChange = (value) => {
    setForm({ ...form, fund_name: value })
    if (value.length >= 2) {
      const filtered = MUTUAL_FUNDS.filter((f) =>
        f.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 7)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectFund = (fund) => {
    setForm({ ...form, fund_name: fund })
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleSubmit = async () => {
    if (!form.fund_name || !form.monthly_amount) return
    setLoading(true)
    try {
      await axios.post(`${API_URL}/portfolio/sip/add`, {
        user_id: userId,
        fund_name: form.fund_name,
        monthly_amount: parseFloat(form.monthly_amount),
        start_date: form.start_date
          ? new Date(form.start_date).toISOString().split("T")[0]
          : null,
        sip_date: parseInt(form.sip_date),
      })
      onAdd()
      onClose()
    } catch (e) {
      console.error("Failed to add SIP:", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl border-t border-[#1f2937] bg-[#111827] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-50">Add SIP</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f2937] text-gray-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <label className="text-xs text-gray-500 mb-1 block">Fund Name</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Type fund name e.g. Mirae, Axis..."
                value={form.fund_name}
                onChange={(e) => handleFundNameChange(e.target.value)}
                className="w-full rounded-xl border border-[#1f2937] bg-[#0a0f1e] py-3 pl-10 pr-4 text-sm text-gray-50 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            {showSuggestions && (
              <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl border border-[#1f2937] bg-[#111827] overflow-hidden shadow-xl max-h-48 overflow-y-auto">
                {suggestions.map((fund, i) => (
                  <button
                    key={i}
                    onClick={() => selectFund(fund)}
                    className={`w-full px-4 py-2.5 text-left text-sm text-gray-50 hover:bg-[#1f2937] ${i !== 0 ? "border-t border-[#1f2937]" : ""}`}
                  >
                    {fund}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Monthly Amount (₹)</label>
              <input
                type="number"
                placeholder="2000"
                value={form.monthly_amount}
                onChange={(e) => setForm({ ...form, monthly_amount: e.target.value })}
                className="w-full rounded-xl border border-[#1f2937] bg-[#0a0f1e] px-4 py-3 text-sm text-gray-50 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">SIP Date</label>
              <input
                type="number"
                min="1"
                max="28"
                placeholder="1"
                value={form.sip_date}
                onChange={(e) => setForm({ ...form, sip_date: e.target.value })}
                className="w-full rounded-xl border border-[#1f2937] bg-[#0a0f1e] px-4 py-3 text-sm text-gray-50 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full rounded-xl border border-[#1f2937] bg-[#0a0f1e] px-4 py-3 text-sm text-gray-50 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !form.fund_name || !form.monthly_amount}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Adding..." : "Add SIP"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PortfolioPage() {
  const userId = localStorage.getItem("ss_uid") || 1
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddStock, setShowAddStock] = useState(false)
  const [showAddSIP, setShowAddSIP] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const deleteHolding = async (id) => {
    setDeletingId(id)
    try {
      await axios.delete(`${API_URL}/portfolio/${id}`)
      await fetchPortfolio()
    } catch (e) {
      console.error("Failed to delete holding:", e)
    } finally {
      setDeletingId(null)
    }
  }

  const deleteSIP = async (id) => {
    setDeletingId(`sip-${id}`)
    try {
      await axios.delete(`${API_URL}/portfolio/sip/${id}`)
      await fetchPortfolio()
    } catch (e) {
      console.error("Failed to delete SIP:", e)
    } finally {
      setDeletingId(null)
    }
  }

  const fetchPortfolio = async () => {
    try {
      const res = await axios.get(`${API_URL}/portfolio/?user_id=${userId}`)
      setPortfolio(res.data)
    } catch (e) {
      console.error("Failed to fetch portfolio:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const summary = portfolio?.summary
  const holdings = portfolio?.holdings || []
  const sips = portfolio?.sips || []

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#0a0f1e] text-gray-50">
      <Header title="Portfolio" />
      <div className="flex flex-col gap-5 px-4 pb-28 pt-4">

        {/* Portfolio Summary */}
        {loading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-[#111827]" />
        ) : summary ? (
          <section className="relative overflow-hidden rounded-2xl border border-[#1f2937] bg-[#111827] p-5">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-blue-500/60 to-emerald-500" />
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Portfolio</p>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
            <p className="font-mono text-4xl font-semibold tracking-tight text-gray-50">
              ₹{summary.current_value?.toLocaleString("en-IN")}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
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
            <div className="mt-3 border-t border-[#1f2937] pt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">Monthly SIP</span>
              <span className="font-mono text-sm font-medium text-blue-400">
                ₹{summary.total_sip_monthly?.toLocaleString("en-IN") || 0}/mo
              </span>
            </div>
          </section>
        ) : null}

        {/* Holdings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-50">Holdings</h2>
              <p className="text-xs text-gray-500">{holdings.length} positions</p>
            </div>
            <button
              onClick={() => setShowAddStock(true)}
              className="flex items-center gap-1.5 rounded-full border border-blue-500 px-3 py-1.5 text-xs font-medium text-blue-500 hover:bg-blue-500/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Stock
            </button>
          </div>
          {holdings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1f2937] bg-[#111827] py-10">
              <p className="text-sm text-gray-500">No holdings yet</p>
              <button
                onClick={() => setShowAddStock(true)}
                className="mt-3 flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                Add your first stock
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#1f2937] bg-[#111827]">
              {holdings.map((h, i) => (
                <div
                  key={h.id}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${i !== 0 ? "border-t border-[#1f2937]" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-50">{h.symbol}</p>
                    <p className="truncate text-xs text-gray-500">{h.company_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-mono text-gray-400">{h.quantity}</span> shares · Avg ₹{h.buy_price}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-medium text-gray-50">
                      ₹{h.current_price?.toLocaleString("en-IN")}
                    </p>
                    <p className={`font-mono text-xs font-medium ${h.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {h.pnl >= 0 ? "+" : ""}₹{h.pnl} ({h.pnl_percent}%)
                    </p>
                  </div>
                  <button
                    onClick={() => deleteHolding(h.id)}
                    disabled={deletingId === h.id}
                    className="ml-2 shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-500 bg-red-500/10 active:bg-red-500/20 disabled:opacity-40"
                  >
                    {deletingId === h.id ? "..." : "del"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SIPs */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-50">SIPs</h2>
              <p className="text-xs text-gray-500">
                {sips.length} active · ₹{summary?.total_sip_monthly?.toLocaleString("en-IN") || 0}/month
              </p>
            </div>
            <button
              onClick={() => setShowAddSIP(true)}
              className="flex items-center gap-1.5 rounded-full border border-blue-500 px-3 py-1.5 text-xs font-medium text-blue-500 hover:bg-blue-500/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Add SIP
            </button>
          </div>
          {sips.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1f2937] bg-[#111827] py-10">
              <p className="text-sm text-gray-500">No SIPs yet</p>
              <button
                onClick={() => setShowAddSIP(true)}
                className="mt-3 flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                Add your first SIP
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#1f2937] bg-[#111827]">
              {sips.map((sip, i) => (
                <div
                  key={sip.id}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${i !== 0 ? "border-t border-[#1f2937]" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-50">{sip.fund_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Since {sip.start_date || "N/A"} · {sip.sip_date ? `${sip.sip_date}th of month` : ""}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="rounded-lg bg-blue-500/15 px-2.5 py-1 font-mono text-xs font-semibold text-blue-400">
                      ₹{sip.monthly_amount?.toLocaleString("en-IN")}/mo
                    </span>
                  </div>
                  <button
                    onClick={() => deleteSIP(sip.id)}
                    disabled={deletingId === `sip-${sip.id}`}
                    className="ml-2 shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-500 bg-red-500/10 active:bg-red-500/20 disabled:opacity-40"
                  >
                    {deletingId === `sip-${sip.id}` ? "..." : "del"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {showAddStock && <AddStockModal onClose={() => setShowAddStock(false)} onAdd={fetchPortfolio} userId={userId} />}
      {showAddSIP && <AddSIPModal onClose={() => setShowAddSIP(false)} onAdd={fetchPortfolio} userId={userId} />}

      <BottomNav active="Portfolio" />
    </main>
  )
}