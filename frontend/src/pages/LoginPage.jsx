import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Eye, EyeOff } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import ThemeToggle from '../components/ThemeToggle'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { token, user } = await api.post('/auth/login', form)
      setAuth(user, token)
      toast.success(`ยินดีต้อนรับ ${user.name}`)
      navigate('/')

    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen
      bg-white dark:bg-gradient-to-b dark:from-scout-950 dark:via-scout-900 dark:to-scout-800
      flex flex-col items-center justify-center px-6 relative transition-colors duration-300">

      {/* Theme toggle มุมขวาบน */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto border-2
          bg-scout-50 border-scout-200
          dark:bg-white/10 dark:border-gold-400/50 dark:backdrop-blur">
          <span className="text-4xl">⚜️</span>
        </div>
        <h1 className="text-2xl font-display font-bold
          text-scout-900 dark:text-white">
          ชุมนุมลูกเสืออาชีวศึกษา
        </h1>
        <p className="text-sm mt-1 text-scout-500 dark:text-scout-300">
          ระบบจัดการการเข้าร่วมกิจกรรม
        </p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm rounded-3xl p-6 border
        bg-white border-gray-500 shadow-xl shadow-scout-100
        dark:bg-white/10 dark:border-white/20 dark:backdrop-blur-md dark:shadow-none">

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm mb-1.5 block text-gray-600 dark:text-white/70">
              ชื่อผู้ใช้
            </label>
            <input
              className="input
                bg-gray-50 border-gray-500 text-gray-900 placeholder:text-gray-400
                dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-white/40"
              placeholder="กรอกชื่อผู้ใช้"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-sm mb-1.5 block text-gray-600 dark:text-white/70">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-10
                  bg-gray-50 border-gray-500 text-gray-900 placeholder:text-gray-400
                  dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-white/40"
                placeholder="กรอกรหัสผ่าน"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="btn w-full font-semibold mt-2 disabled:opacity-50
              bg-scout-700 hover:bg-scout-800 text-white
              dark:bg-gold-500 dark:hover:bg-gold-600">
            {loading
              ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'เข้าสู่ระบบ'
            }
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
          <p className="text-xs text-center font-medium mb-2 text-gray-400 dark:text-white/40">
            บัญชีทดสอบ (กดเพื่อกรอกอัตโนมัติ)
          </p>
          <div className="space-y-1">
            {[
              { user: 'admin',         pass: 'admin123',   label: 'Admin' },
              { user: 'campmanager1',  pass: 'camp123',    label: 'ผู้ดูแลค่าย 1' },
              { user: 'campmanager2',  pass: 'camp123',    label: 'ผู้ดูแลค่าย 2' },
              { user: 'director1',     pass: 'password123', label: 'ผู้กำกับ 1' },
              { user: 'director2',     pass: 'password123', label: 'ผู้กำกับ 2' },
              { user: 'director3',     pass: 'password123', label: 'ผู้กำกับ 3' },
              { user: 'staff1',        pass: 'staff123',   label: 'เจ้าหน้าที่ 1' },
              { user: 'staff2',        pass: 'staff123',   label: 'เจ้าหน้าที่ 2' },
              { user: 'scout001',      pass: 'scout123',   label: 'ลูกเสือ 1' },
              { user: 'scout002',      pass: 'scout123',   label: 'ลูกเสือ 2' },
              { user: 'scout003',      pass: 'scout123',   label: 'ลูกเสือ 3' },
            ].map(a => (
              <button key={a.user} type="button"
                onClick={() => setForm({ username: a.user, password: a.pass })}
                className="w-full flex justify-between px-3 py-1.5 rounded-lg transition-colors text-xs
                  hover:bg-gray-50 dark:hover:bg-white/10">
                <span className="text-gray-500 dark:text-white/50">{a.label}</span>
                <span className="font-mono text-gray-400 dark:text-white/30">{a.user}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}