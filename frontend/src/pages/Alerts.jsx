import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Header from "../components/layout/Header"
import {

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
  TrendingUp,
  LayoutDashboard,
  Briefcase,
  MessageCircle,
  MoreHorizontal,
  CheckCheck,
  RefreshCw,
  Loader2,
  Bell,
} from "lucide-react"

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Research", icon: TrendingUp, path: "/research" },
  { label: "Portfolio", icon: Briefcase, path: "/portfolio" },
  { label: "Chat", icon: MessageCircle, path: "/chat" },
  { label: "More", icon: MoreHorizontal, path: "/more" },
]

const SEVERITY_STYLES = {
  HIGH: "border-l-red-500 bg-red-500/5",
  MEDIUM: "border-l-amber-500 bg-amber-500/5",
  LOW: "border-l-blue-500 bg-blue-500/5",
}

const SEVERITY_BADGE = {
  HIGH: "bg-red-500/15 text-red-500",
  MEDIUM: "bg-amber-500/15 text-amber-500",
  LOW: "bg-blue-500/15 text-blue-500",
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

export default function AlertsPage() {
  const [notifications, setNotifications] = useState([])
  const [marketStatus, setMarketStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [filter, setFilter] = useState("all")

  const fetchData = async () => {
    try {
      const [notifRes, statusRes] = await Promise.all([
        axios.get(`${API_URL}/alerts/notifications`),
        axios.get(`${API_URL}/alerts/market-status`),
      ])
      setNotifications(notifRes.data.notifications || [])
      setMarketStatus(statusRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const markAllRead = async () => {
    try {
      await axios.put(`${API_URL}/alerts/notifications/read-all`)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (e) {
      console.error(e)
    }
  }

  const checkAlerts = async () => {
    setChecking(true)
    try {
      await axios.get(`${API_URL}/alerts/check`)
      await fetchData()
    } catch (e) {
      console.error(e)
    } finally {
      setChecking(false)
    }
  }

  const markRead = async (id) => {
    try {
      await axios.put(`${API_URL}/alerts/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (e) {
      console.error(e)
    }
  }

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read
    if (filter === "high") return n.severity === "HIGH"
    return true
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#0a0f1e] text-gray-50">
      <Header title="Alerts" />

      <div className="flex flex-col gap-4 px-4 pb-28 pt-4">

        {/* Market Status */}
        {marketStatus && (
          <section className={`rounded-2xl border border-[#1f2937] p-4 ${
            marketStatus.market_open ? "bg-emerald-500/5" : "bg-[#111827]"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Market Status</p>
                <p className={`mt-1 text-sm font-semibold ${
                  marketStatus.market_open ? "text-emerald-500" : "text-gray-400"
                }`}>
                  {marketStatus.market_open ? "Market is OPEN" : "Market is CLOSED"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{marketStatus.market_hours}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                marketStatus.market_open ? "bg-emerald-500/15" : "bg-[#1f2937]"
              }`}>
                <span className="relative flex h-3 w-3">
                  {marketStatus.market_open && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  )}
                  <span className={`relative inline-flex h-3 w-3 rounded-full ${
                    marketStatus.market_open ? "bg-emerald-500" : "bg-gray-500"
                  }`} />
                </span>
              </div>
            </div>
            <button
              onClick={checkAlerts}
              disabled={checking}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#1f2937] py-2 text-xs font-medium text-gray-400 hover:text-gray-50 transition-colors"
            >
              {checking
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />
              }
              {checking ? "Checking alerts..." : "Check alerts now"}
            </button>
          </section>
        )}

        {/* Filter + Mark All Read */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {["all", "unread", "high"].map((f) => (
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
                {f === "unread" && unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-red-500 px-1 text-[10px] text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1f2937] bg-[#111827] py-12">
            <Bell className="h-8 w-8 text-gray-500 mb-3" />
            <p className="text-sm text-gray-500">No alerts found</p>
            <button
              onClick={checkAlerts}
              className="mt-3 flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Check now
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && markRead(notif.id)}
                className={`relative rounded-2xl border-l-[3px] border border-[#1f2937] p-4 cursor-pointer transition-colors hover:bg-[#1f2937] ${
                  SEVERITY_STYLES[notif.severity] || "border-l-blue-500"
                } ${!notif.is_read ? "opacity-100" : "opacity-60"}`}
              >
                {!notif.is_read && (
                  <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-blue-500" />
                )}
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {notif.symbol && (
                        <span className="font-mono text-sm font-bold text-gray-50">
                          {notif.symbol}
                        </span>
                      )}
                      <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                        SEVERITY_BADGE[notif.severity] || "bg-blue-500/15 text-blue-500"
                      }`}>
                        {notif.severity}
                      </span>
                      <span className="rounded-md bg-[#1f2937] px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
                        {notif.alert_type?.replace(/_/g, " ")}
                      </span>
                      {notif.whatsapp_sent && (
                        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-500">
                          WA
                        </span>
                      )}
                      {notif.email_sent && (
                        <span className="rounded bg-blue-500/15 px-1.5 py-0.5 font-mono text-[10px] text-blue-400">
                          EMAIL
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-200">{notif.message}</p>
                    {notif.detail && (
                      <p className="text-xs text-gray-500 mt-1">{notif.detail}</p>
                    )}
                    {notif.action && (
                      <p className="text-xs text-blue-400 mt-1 font-medium">
                        Action: {notif.action}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-500 mt-2">{notif.created_at}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <BottomNav active="More" />
    </main>
  )
}