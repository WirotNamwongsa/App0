import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'
import { Activity, Users, ScanLine, Flag } from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const { data: overview } = useQuery('admin-overview', () => api.get('/reports/overview'))

  const handleLogout = () => {
    logout()
  }

 const quickLinks = [
  { label: 'Import ลูกเสือ', icon: '📥', path: '/admin/import' },
  { label: 'จัดการกิจกรรม', icon: '🏅', path: '/admin/activities' },
  { label: 'จัดการบัญชี', icon: '👥', path: '/admin/accounts' },
  { label: 'Audit Log', icon: '📋', path: '/admin/audit' },
]

  return (
    <div className="page">
      <PageHeader title="Admin Dashboard" />

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card text-center">
          <Users size={20} className="mx-auto text-scout-500 mb-2" />
          <p className="text-2xl font-display font-bold text-scout-900">{overview?.totalScouts || 0}</p>
          <p className="text-xs text-gray-400">ผู้เข้าร่วม</p>
        </div>
        <div className="card text-center">
          <ScanLine size={20} className="mx-auto text-gold-500 mb-2" />
          <p className="text-2xl font-display font-bold text-scout-900">{overview?.todayScans || 0}</p>
          <p className="text-xs text-gray-400">สแกนวันนี้</p>
        </div>
        <button onClick={() => navigate('/admin/camps')} className="card text-center hover:opacity-80 transition-opacity">
          <Flag size={20} className="mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-display font-bold text-scout-900">{overview?.totalCamps || 0}</p>
          <p className="text-xs text-gray-400">ค่ายย่อย</p>
        </button>
        <div className="card text-center">
          <Activity size={20} className="mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-display font-bold text-scout-900">{overview?.activities?.length || 0}</p>
          <p className="text-xs text-gray-400">กิจกรรม</p>
        </div>
      </div>

      <h2 className="font-semibold text-scout-800 mb-3 text-sm">จัดการระบบ</h2>
      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map(link => (
         <button key={link.path} onClick={() => navigate(link.path)}
          className="card flex flex-col items-center gap-2 py-5 text-center hover:opacity-80 transition-opacity
            border-2 border-scout-200 dark:border-scout-700
           text-scout-700 dark:text-scout-300">
          <span className="text-3xl">{link.icon}</span>
          <span className="text-sm font-medium">{link.label}</span>
          </button>
        ))}
      </div>

      <h2 className="font-semibold text-scout-800 mb-3 mt-5 text-sm">กิจกรรมล่าสุด</h2>
      <div className="space-y-2">
        {overview?.activities?.slice(0, 5).map(act => (
          <div key={act.id} className="card flex items-center justify-between">
            <p className="text-sm text-scout-800">{act.name}</p>
            <span className="text-sm font-bold text-scout-700">{act._count?.attendances || 0} คน</span>
          </div>
        ))}
      </div>
      
      <BottomNav />
    </div>
  )
}
