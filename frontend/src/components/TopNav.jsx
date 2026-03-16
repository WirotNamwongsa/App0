import { useAuthStore } from '../store/authStore'
import { LogOut } from 'lucide-react'

export default function TopNav() {
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <button 
        onClick={handleLogout}
        className="bg-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
        title="ออกจากระบบ"
      >
        <LogOut size={18} />
        <span className="text-sm font-medium">ออก</span>
      </button>
    </div>
  )
}
