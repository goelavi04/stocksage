

import { useState } from "react"
import {
  Bell,
  ArrowDownRight,
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
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*  Data (hardcoded constants — swap for props / API later)                   */
/* -------------------------------------------------------------------------- */

const PORTFOLIO = {
  totalValue: "5,694.10",
  invested: "7,080.82",
  returns: "1,386.72",
  returnsPct: "-19.58%",
  todayChange: "80.54",
  todayPct: "-0.11%",
}

const INDICES = [
  { name: "NIFTY 50", value: "24,500", change: "+0.32%", positive: true },
  { name: "SENSEX", value: "80,200", change: "+0.28%", positive: true },
  { name: "BANK NIFTY", value: "52,100", change: "-0.15%", positive: false },
  { name: "GOLD", value: "71,200", change: "+0.45%", positive: true },
]

const HOLDINGS = [
  {
    symbol: "JIOFIN",
    name: "Jio Financial Services",
    qty: 14,
    price: "233.40",
    pnl: "-32.71%",
    positive: false,
    signal: "WATCH",
  },
  {
    symbol: "IDEA",
    name: "Vodafone Idea",
    qty: 100,
    price: "14.16",
    pnl: "-0.98%",
    positive: false,
    signal: "BUY",
  },
  {
    symbol: "TATASTEEL",
    name: "Tata Steel",
    qty: 5,
    price: "202.10",
    pnl: "+27.19%",
    positive: true,
    signal: "HOLD",
  },
]

const SIGNAL_STYLES = {
  WATCH: "bg-amber-500/15 text-amber-500",
  BUY: "bg-emerald-500/15 text-emerald-500",
  HOLD: "bg-blue-500/15 text-blue-500",
}

const QUICK_ACTIONS = [
  { label: "Add Stock", icon: Plus },
  { label: "Add SIP", icon: CalendarPlus },
  { label: "Check Alerts", icon: BellRing },
]

const NEWS = [
  {
    headline: "Tata Steel jumps 4% as global steel prices rebound on China demand",
    source: "Economic Times",
    time: "2h ago",
    sentiment: "POSITIVE",
  },
  {
    headline: "Jio Financial slips to fresh low amid weak lending outlook",
    source: "Moneycontrol",
    time: "5h ago",
    sentiment: "NEGATIVE",
  },
]

const SENTIMENT_STYLES = {
  POSITIVE: "bg-emerald-500/15 text-emerald-500",
  NEGATIVE: "bg-red-500/15 text-red-500",
  NEUTRAL: "bg-gray-800 text-gray-500",
}

const NAV_TABS = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Research", icon: LineChart, active: false },
  { label: "Portfolio", icon: Briefcase, active: false },
  { label: "Chat", icon: MessageCircle, active: false },
  { label: "More", icon: MoreHorizontal, active: false },
]

/* -------------------------------------------------------------------------- */
/*  Money — renders ₹ scaled to match the digit size                          */
/* -------------------------------------------------------------------------- */

function Money({ amount, sign = "", className = "" }) {
  return (
    <span className={className}>
      {sign}
      <span className="text-[0.82em] font-normal">₹</span>
      {amount}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Header                                                                    */
/* -------------------------------------------------------------------------- */

function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-800 bg-[#0a0f1e]/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="text-xl font-bold tracking-tight text-gray-50">
          StockSage
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-800 bg-gray-900 text-gray-500 transition-colors hover:text-gray-50"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-mono text-[10px] font-semibold text-gray-50">
              3
            </span>
          </button>
          <button
            type="button"
            aria-label="Profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-sm font-bold text-gray-50"
          >
            RS
          </button>
        </div>
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/*  Portfolio Summary                                                         */
/* -------------------------------------------------------------------------- */

function PortfolioSummary() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-blue-500/60 to-emerald-500" />

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
      <Money
        amount={PORTFOLIO.totalValue}
        className="mt-1.5 block font-mono text-4xl font-semibold tracking-tight text-gray-50"
      />

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Invested
          </p>
          <Money
            amount={PORTFOLIO.invested}
            className="mt-1 block font-mono text-lg font-medium text-gray-50"
          />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Returns
          </p>
          <Money
            sign="-"
            amount={PORTFOLIO.returns}
            className="mt-1 block font-mono text-lg font-medium text-red-500"
          />
          <p className="font-mono text-xs font-medium text-red-500">
            ({PORTFOLIO.returnsPct})
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-3">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
          Today
        </span>
        <span className="flex items-center gap-1 font-mono text-sm font-medium text-red-500">
          <ArrowDownRight className="h-3.5 w-3.5" />
          <Money sign="-" amount={PORTFOLIO.todayChange} /> ({PORTFOLIO.todayPct})
        </span>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Market Status Bar                                                         */
/* -------------------------------------------------------------------------- */

function MarketStatusBar() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-2.5">
        {INDICES.map((index) => (
          <div
            key={index.name}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-800 bg-gray-800 px-3.5 py-2.5"
          >
            <span className="text-xs font-medium text-gray-500">
              {index.name}
            </span>
            <span className="font-mono text-sm font-medium text-gray-50">
              {index.value}
            </span>
            <span
              className={`font-mono text-xs font-medium ${
                index.positive ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {index.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Holdings                                                                  */
/* -------------------------------------------------------------------------- */

function Holdings() {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-gray-50">Holdings</h2>
      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        {HOLDINGS.map((h, i) => (
          <button
            key={h.symbol}
            type="button"
            className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-800 ${
              i % 2 === 1 ? "bg-gray-800/40" : ""
            } ${i !== 0 ? "border-t border-gray-800" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-50">{h.symbol}</p>
              <p className="truncate text-xs text-gray-500">{h.name}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-gray-500">
                <span className="font-mono text-gray-50">{h.qty}</span> shares
              </p>
            </div>
            <div className="shrink-0 text-right">
              <Money
                amount={h.price}
                className="font-mono text-sm font-medium text-gray-50"
              />
              <p
                className={`font-mono text-xs font-medium ${
                  h.positive ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {h.pnl}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${SIGNAL_STYLES[h.signal]}`}
            >
              {h.signal}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
          </button>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  AI Briefing                                                               */
/* -------------------------------------------------------------------------- */

function AiBriefing() {
  const [open, setOpen] = useState(true)

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-800 border-l-[3px] border-l-blue-500 bg-gray-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3.5 text-left"
      >
        <h2 className="text-base font-bold text-gray-50">AI Briefing</h2>
        <span className="rounded-md bg-gray-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Today
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm leading-relaxed text-gray-500">
            Your portfolio requires attention.{" "}
            <span className="font-medium text-gray-50">JIOFIN</span> is showing
            significant loss at{" "}
            <span className="font-mono text-red-500">-32.71%</span>.{" "}
            <span className="font-medium text-gray-50">TATASTEEL</span> remains
            your strongest performer at{" "}
            <span className="font-mono text-emerald-500">+27.19%</span>. Consider
            reviewing your{" "}
            <span className="font-medium text-gray-50">JIOFIN</span> position.
          </p>
        </div>
      )}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Quick Actions                                                             */
/* -------------------------------------------------------------------------- */

function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-blue-500 bg-transparent px-2 py-3 text-gray-50 transition-colors hover:bg-blue-500/10"
        >
          <action.icon className="h-5 w-5 text-blue-500" />
          <span className="text-xs font-medium">{action.label}</span>
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Market News                                                               */
/* -------------------------------------------------------------------------- */

function MarketNews() {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-gray-50">Market News</h2>
      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        {NEWS.map((item, i) => (
          <button
            key={item.headline}
            type="button"
            className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-800 ${
              i !== 0 ? "border-t border-gray-800" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-50">
                {item.headline}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {item.source} · {item.time}
                </span>
                <span
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${SENTIMENT_STYLES[item.sentiment]}`}
                >
                  {item.sentiment}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
          </button>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Bottom Navigation                                                         */
/* -------------------------------------------------------------------------- */

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t-2 border-gray-800 bg-gray-900/95 backdrop-blur-md">
      <div className="grid grid-cols-5">
        {NAV_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            aria-current={tab.active ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
              tab.active
                ? "text-blue-500"
                : "text-gray-500 hover:text-gray-50"
            }`}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-gray-50">
      <div className="mx-auto max-w-md pb-24">
        <DashboardHeader />
        <main className="space-y-5 px-4 py-5">
          <PortfolioSummary />
          <MarketStatusBar />
          <Holdings />
          <AiBriefing />
          <QuickActions />
          <MarketNews />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}