import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Plus, Pencil, Trash2, X, Camera, Loader2, Check } from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

const COLORS = [
  "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#f97316",
]

function getInitials(name) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
}

async function resizeImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const size = 300
        const canvas = document.createElement("canvas")
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        resolve(canvas.toDataURL("image/jpeg", 0.75))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function Avatar({ user, size = "lg" }) {
  const cls = size === "lg" ? "h-20 w-20 text-2xl" : "h-10 w-10 text-sm"
  if (user?.photo) {
    return <img src={user.photo} alt={user.name} className={`${cls} rounded-full object-cover`} />
  }
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: user?.color || "#3b82f6" }}
    >
      {getInitials(user?.name || "?")}
    </div>
  )
}

function ProfileModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user?.name || "")
  const [photo, setPhoto] = useState(user?.photo || null)
  const [color, setColor] = useState(user?.color || COLORS[0])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const handlePhoto = async (e) => {
    const file = e.target.files[0]
    if (file) setPhoto(await resizeImage(file))
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave({ name: name.trim(), photo, color })
    } finally {
      setSaving(false)
    }
  }

  const preview = { name, photo, color }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl border-t border-[#1f2937] bg-[#111827] p-6 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-50">{user ? "Edit Profile" : "Add Profile"}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f2937] text-gray-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Avatar preview */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Avatar user={preview} size="lg" />
            <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 shadow-lg">
              <Camera className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          {photo && (
            <button onClick={() => setPhoto(null)} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
              Remove photo
            </button>
          )}
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-1 block">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aviral, Papa, Bhai..."
            className="w-full rounded-xl border border-[#1f2937] bg-[#0a0f1e] px-4 py-3 text-sm text-gray-50 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Color picker — only when no photo */}
        {!photo && (
          <div className="mb-6">
            <label className="text-xs text-gray-500 mb-2 block">Avatar Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full flex items-center justify-center transition-transform active:scale-90"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : user ? "Save Changes" : "Add Profile"}
        </button>
      </div>
    </div>
  )
}

export default function ProfilesPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/`)
      setUsers(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const selectUser = (user) => {
    localStorage.setItem("ss_uid", String(user.id))
    localStorage.setItem("ss_uname", user.name)
    localStorage.setItem("ss_uphoto", user.photo || "")
    localStorage.setItem("ss_ucolor", user.color || "#3b82f6")
    navigate("/dashboard")
  }

  const handleSave = async (data) => {
    if (editUser) {
      await axios.put(`${API_URL}/users/${editUser.id}`, data)
    } else {
      await axios.post(`${API_URL}/users/`, data)
    }
    await fetchUsers()
    setShowModal(false)
    setEditUser(null)
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name}'s profile and all their portfolio data?`)) return
    setDeletingId(user.id)
    try {
      await axios.delete(`${API_URL}/users/${user.id}`)
      if (localStorage.getItem("ss_uid") === String(user.id)) {
        localStorage.removeItem("ss_uid")
      }
      await fetchUsers()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#0a0f1e] text-gray-50 flex flex-col px-5 pt-safe">
      {/* Logo */}
      <div className="flex items-center gap-2 pt-12 pb-2">
        <img src="/icon-192.png" alt="StockSage" className="h-8 w-8 rounded-lg object-cover" />
        <span className="text-lg font-bold tracking-tight text-gray-50">StockSage</span>
      </div>

      <div className="flex-1 pt-10">
        <h1 className="text-2xl font-bold text-gray-50 mb-1">Who's investing today?</h1>
        <p className="text-sm text-gray-500 mb-8">Tap a profile to open their portfolio</p>

        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {users.map((user) => (
              <div key={user.id} className="relative">
                <button
                  onClick={() => selectUser(user)}
                  className="w-full flex flex-col items-center gap-3 rounded-2xl border border-[#1f2937] bg-[#111827] p-5 active:scale-95 transition-transform"
                >
                  <Avatar user={user} size="lg" />
                  <span className="text-sm font-semibold text-gray-50 text-center break-words w-full">{user.name}</span>
                </button>
                {/* Edit / Delete */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditUser(user); setShowModal(true) }}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0f1e] text-gray-500 hover:text-gray-50 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(user) }}
                    disabled={deletingId === user.id}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0f1e] text-gray-500 hover:text-red-400 disabled:opacity-40 transition-colors"
                  >
                    {deletingId === user.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Trash2 className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            ))}

            {/* Add profile card */}
            <button
              onClick={() => { setEditUser(null); setShowModal(true) }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#1f2937] bg-transparent p-5 active:scale-95 transition-transform"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-[#1f2937]">
                <Plus className="h-8 w-8 text-gray-500" />
              </div>
              <span className="text-sm font-medium text-gray-500">Add Profile</span>
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <ProfileModal
          user={editUser}
          onClose={() => { setShowModal(false); setEditUser(null) }}
          onSave={handleSave}
        />
      )}
    </main>
  )
}
