import { useQuery } from 'react-query'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'

export default function ScoutProfile() {
  const { data: scout } = useQuery('my-scout', () => api.get('/scouts/my'))
  const { logout } = useAuthStore()

  const fields = [
    { label: 'ชื่อ-สกุล', value: scout ? `${scout.user?.prefix || ''} ${scout.firstName} ${scout.lastName}`.trim() : '-' },
    { label: 'เพศ', value: scout?.gender || '-' },
    { label: 'โรงเรียน', value: scout?.school || '-' },
    { label: 'จังหวัด', value: scout?.province || '-' },
    { label: 'เบอร์โทร', value: scout?.phone || '-' },
    { label: 'อีเมล', value: scout?.email || '-' },
  ]

  const healthFields = [
    { label: 'การแพ้', value: scout?.allergies || '-' },
    { label: 'โรคประจำตัว', value: scout?.congenitalDisease || '-' },
  ]

  return (
    <div className="page">
      <PageHeader title="โปรไฟล์ของฉัน" />

      <div className="card space-y-4 mb-4">
        {fields.map(f => (
          <div key={f.label} className="flex justify-between items-start">
            <span className="text-gray-500 text-sm">{f.label}</span>
            <span className="text-scout-900 dark:text-white text-sm font-medium text-right max-w-[60%]">{f.value}</span>
          </div>
        ))}
      </div>

      <div className="card space-y-4 mb-4">
        {healthFields.map(f => (
          <div key={f.label} className="flex justify-between items-start">
            <span className="text-gray-500 text-sm">{f.label}</span>
            <span className="text-scout-900 dark:text-white text-sm font-medium text-right max-w-[60%]">
              {f.value === '-' ? 'ไม่มี' : f.value}
            </span>
          </div>
        ))}
      </div>

      <div className="card bg-scout-50 dark:bg-scout-900/30 mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📞</div>
          <div>
            <p className="text-sm font-semibold text-scout-700 dark:text-scout-300">ติดต่อผู้ดูแลค่าย</p>
            <p className="text-xs text-scout-600 dark:text-scout-400 mt-1">
              หากต้องการแก้ไขข้อมูลที่ไม่สามารถแก้ไขได้ กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}