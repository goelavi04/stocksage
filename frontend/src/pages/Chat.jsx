import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  Bell,
  User,
  Send,
  Sparkles,
  Loader2,
  TrendingUp,
  LayoutDashboard,
  Briefcase,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react"

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Research", icon: TrendingUp, path: "/research" },
  { label: "Portfolio", icon: Briefcase, path: "/portfolio" },
  { label: "Chat", icon: MessageCircle, path: "/chat" },
  { label: "More", icon: MoreHorizontal, path: "/more" },
]

const SUGGESTED_QUESTIONS = [
  "What should I do with my JIOFIN position?",
  "Is now a good time to buy TCS?",
  "How is my portfolio performing overall?",
  "Which stock in my portfolio needs attention?",
  "Should I add more to my SIP amount?",
  "Explain RSI to me in simple terms",
  "What is the difference between large cap and mid cap?",
  "How does SIP compounding work?",
]

function BottomNav({ active = "Chat" }) {
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

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am StockSage AI — your personal investment advisor. I know your portfolio and can help you make better investment decisions. What would you like to know?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (text) => {
    const message = text || input.trim()
    if (!message || loading) return

    setInput("")

    // Add user message
    const userMsg = {
      role: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      // Build history for context
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await axios.post(
        "http://127.0.0.1:8000/chat/message",
        {
          message,
          father_mode: false,
          history,
        },
        { timeout: 60000 }
      )

      const aiMsg = {
        role: "assistant",
        content: res.data.answer,
        source: res.data.ai_source,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (error) {
      const errMsg = {
        role: "assistant",
        content: "Sorry, I could not connect to the AI service. Please make sure the backend is running and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-[#0a0f1e] text-gray-50">

      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#1f2937] bg-[#0a0f1e]/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <TrendingUp className="h-5 w-5 text-gray-50" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-gray-50">StockSage AI</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] text-emerald-500">Online · Powered by Groq</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-[#1f2937]">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f2937] text-gray-50">
            <User className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-48 space-y-4">

        {/* Suggested Questions — shown only at start */}
        {messages.length === 1 && (
          <div className="mb-2">
            <p className="text-xs text-gray-500 mb-2">Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-[#1f2937] bg-[#111827] px-3 py-1.5 text-xs text-gray-300 hover:border-blue-500 hover:text-blue-400 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* AI Avatar */}
            {msg.role === "assistant" && (
              <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
            )}

            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-tr-sm bg-blue-500 text-white"
                    : "rounded-tl-sm bg-[#111827] text-gray-200 border border-[#1f2937]"
                }`}
              >
                {msg.content}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                {msg.source && (
                  <span className="text-[10px] text-gray-500">· {msg.source}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-[#1f2937] bg-[#111827] px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions when mid conversation */}
      {messages.length > 1 && messages.length < 6 && (
        <div className="fixed bottom-24 left-0 right-0 mx-auto max-w-md px-4">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SUGGESTED_QUESTIONS.slice(4).map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="shrink-0 rounded-full border border-[#1f2937] bg-[#0a0f1e] px-3 py-1.5 text-xs text-gray-400 hover:border-blue-500 hover:text-blue-400"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="fixed bottom-16 left-0 right-0 mx-auto max-w-md border-t border-[#1f2937] bg-[#0a0f1e] px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-2xl border border-[#1f2937] bg-[#111827] px-4 py-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your portfolio..."
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-gray-50 placeholder:text-gray-500 focus:outline-none"
              style={{ maxHeight: "120px" }}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white disabled:opacity-40 hover:bg-blue-600 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      <BottomNav active="Chat" />
    </main>
  )
}