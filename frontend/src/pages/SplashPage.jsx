import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function SplashPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    setTimeout(() => {
      if (user) navigate('/')
      else navigate('/login')
    }, 1800)
  }, [])

  return (
    <div className="min-h-screen bg-scout-900 flex flex-col items-center justify-center gap-6">
      <div className="w-24 h-24 bg-scout-700 rounded-full flex items-center justify-center shadow-2xl border-4 border-gold-400">
        <span className="text-4xl">⚜️</span>
      </div>
      <div className="text-center">
        <h1 className="text-white text-2xl font-display font-bold">ชุมนุมลูกเสือ</h1>
        <p className="text-scout-300 text-sm mt-1">อาชีวศึกษา</p>
      </div>
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mt-4" />
    </div>
  )
}
