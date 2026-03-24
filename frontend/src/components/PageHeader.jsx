import { useNavigate } from 'react-router-dom'
import { ChevronLeft, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function PageHeader({ title, showBack = false, showLogout = false, hideOnMobile = false }) {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  return (
    <div className={`page-header flex items-center gap-2 mb-5 ${hideOnMobile ? 'hidden sm:block' : ''}`}>
      {showBack && (
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-scout-50 dark:hover:bg-scout-800 text-scout-700 dark:text-scout-300">
          <ChevronLeft size={22} />
        </button>
      )}
      <h1 className="text-xl font-display font-bold text-scout-900 dark:text-white flex-1">{title}</h1>
      {showLogout && (
        <button
          type="button"
          onClick={logout}
          className="md:hidden p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
          aria-label="Logout"
        >
          <LogOut size={20} />
        </button>
      )}
    </div>
  )
}