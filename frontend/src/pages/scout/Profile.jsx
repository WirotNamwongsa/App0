import { useQuery } from 'react-query'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'

export default function ScoutProfile() {
  const { data: scout } = useQuery('my-scout', () => api.get('/scouts/my'))
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  const fields = [
    { label: 'ชื่อ-สกุล', value: scout ? `${scout.firstName} ${scout.lastName}` : '-' },
    { label: 'ชื่อเล่น', value: scout?.nickname || '-' },
    { label: 'โรงเรียน', value: scout?.school || '-' },
    { label: 'จังหวัด', value: scout?.province || '-' },
    { label: 'เบอร์โทร', value: scout?.phone || '-' },
    { label: 'อีเมล', value: scout?.email || '-' },
  ]

  return (
    <div className="page">
      <PageHeader title="โปรไฟล์ของฉัน" />
      <div className="card space-y-4">
        {fields.map(f => (
          <div key={f.label} className="flex justify-between items-start">
            <span className="text-gray-500 text-sm">{f.label}</span>
            <span className="text-scout-900 text-sm font-medium text-right max-w-[60%]">{f.value}</span>
          </div>
        ))}
      </div>
      <div className="card mt-4 bg-scout-50">
        <p className="text-xs text-scout-600">หากข้อมูลไม่ถูกต้อง กรุณาติดต่อผู้กำกับหมู่</p>
      </div>
      <BottomNav />
    </div>
  )
}
