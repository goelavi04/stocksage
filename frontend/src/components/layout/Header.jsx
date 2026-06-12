import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, X, CheckCheck } from "lucide-react"
import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const SEVERITY_STYLES = {
  HIGH: "border-l-red-500",
  MEDIUM: "border-l-amber-500",
  LOW: "border-l-blue-500",
}

const SEVERITY_BADGE = {
  HIGH: "bg-red-500/15 text-red-500",
  MEDIUM: "bg-amber-500/15 text-amber-500",
  LOW: "bg-blue-500/15 text-blue-500",
}

export default function Header({ title = "StockSage" }) {
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/alerts/notifications`)
      const notifs = res.data.notifications || []
      setNotifications(notifs)
      setUnreadCount(notifs.filter((n) => !n.is_read).length)
    } catch (e) {
      console.error(e)
    }
  }

  const markAllRead = async () => {
    try {
      await axios.put(`${API_URL}/alerts/notifications/read-all`)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (e) {
      console.error(e)
    }
  }

  const markRead = async (id) => {
    try {
      await axios.put(`${API_URL}/alerts/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#1f2937] bg-[#0a0f1e]/90 px-4 py-3 backdrop-blur-md">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img src="/icon-192.png" alt="StockSage" className="h-8 w-8 rounded-lg object-cover" />
        <span className="text-lg font-bold tracking-tight text-gray-50">{title}</span>
      </div>

      <div className="flex items-center gap-2">

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications((v) => !v)
              setShowProfile(false)
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-[#1f2937] hover:text-gray-50 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-mono text-[10px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 rounded-2xl border border-[#1f2937] bg-[#111827] shadow-2xl overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f2937]">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-50">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-[10px] text-blue-500 hover:underline"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-500 hover:text-gray-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Bell className="h-6 w-6 text-gray-500 mb-2" />
                    <p className="text-xs text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif, i) => {
                    const borderClass = SEVERITY_STYLES[notif.severity] || "border-l-blue-500"
                    const badgeClass = SEVERITY_BADGE[notif.severity] || "bg-blue-500/15 text-blue-500"
                    return (
                      <div
                        key={notif.id}
                        onClick={() => markRead(notif.id)}
                        className={`border-l-[3px] px-4 py-3 cursor-pointer hover:bg-[#1f2937] transition-colors ${borderClass} ${
                          i !== 0 ? "border-t border-[#1f2937]" : ""
                        } ${!notif.is_read ? "bg-blue-500/5" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {notif.symbol && (
                                <span className="font-mono text-xs font-bold text-gray-50">
                                  {notif.symbol}
                                </span>
                              )}
                              <span className={`rounded px-1 py-0.5 font-mono text-[9px] font-semibold ${badgeClass}`}>
                                {notif.severity}
                              </span>
                              {notif.whatsapp_sent && (
                                <span className="rounded bg-emerald-500/15 px-1 py-0.5 font-mono text-[9px] text-emerald-500">
                                  WA
                                </span>
                              )}
                              {notif.email_sent && (
                                <span className="rounded bg-blue-500/15 px-1 py-0.5 font-mono text-[9px] text-blue-400">
                                  EMAIL
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-200 leading-snug">{notif.message}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{notif.created_at}</p>
                          </div>
                          {!notif.is_read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[#1f2937] px-4 py-2.5">
                <button
                  onClick={() => {
                    setShowNotifications(false)
                    navigate("/alerts")
                  }}
                  className="w-full text-center text-xs text-blue-500 hover:underline"
                >
                  View all alerts
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setShowProfile((v) => !v)
              setShowNotifications(false)
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-sm font-bold text-white"
          >
            AG
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-11 w-64 rounded-2xl border border-[#1f2937] bg-[#111827] shadow-2xl overflow-hidden z-50">
              {/* Profile Info */}
              <div className="px-4 py-4 border-b border-[#1f2937]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-lg font-bold text-white">
                    AG
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-50">Aviral Goel</p>
                    <p className="text-xs text-gray-500">KJ Somaiya · AI & DS</p>
                    <p className="text-xs text-blue-400 mt-0.5">goelavi2311@gmail.com</p>
                  </div>
                </div>
              </div>

              {/* Portfolio Quick Stats */}
              <div className="px-4 py-3 border-b border-[#1f2937]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Portfolio</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-500">Holdings</p>
                    <p className="font-mono text-sm font-semibold text-gray-50">3 stocks</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">SIPs</p>
                    <p className="font-mono text-sm font-semibold text-gray-50">4 active</p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="px-4 py-3 border-b border-[#1f2937]">
                {[
                  { label: "View Portfolio", path: "/portfolio" },
                  { label: "Check Alerts", path: "/alerts" },
                  { label: "AI Chat", path: "/chat" },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setShowProfile(false)
                      navigate(item.path)
                    }}
                    className="w-full text-left py-1.5 text-sm text-gray-400 hover:text-gray-50 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* App Info */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">StockSage v2.0</span>
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-500">
                    LIVE
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}