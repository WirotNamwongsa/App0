import { useQuery } from 'react-query'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import BottomNav from '../../components/BottomNav'
import PageHeader from '../../components/PageHeader'

export default function CampReport() {
  const { user } = useAuthStore()
  const { data } = useQuery('camp-report', () => api.get(`/reports/camp/${user.campId}`))

  return (
    <div className="page">
      <PageHeader title="รายงาน" />
      <div className="space-y-3">
        {data?.activityStats?.map(act => (
          <div key={act.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <p className="font-medium text-scout-900">{act.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${act.type === 'MAIN' ? 'badge-main' : act.type === 'SPECIAL' ? 'badge-special' : 'badge-free'}`}>
                {act.type === 'MAIN' ? 'หลัก' : act.type === 'SPECIAL' ? 'พิเศษ' : 'ว่าง'}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1">
              <div className={`h-full rounded-full ${act.percentage > 80 ? 'bg-green-500' : act.percentage > 50 ? 'bg-scout-500' : 'bg-yellow-500'}`}
                style={{ width: `${act.percentage}%` }} />
            </div>
            <p className="text-xs text-gray-400">{act.attended}/{act.total} คน ({act.percentage}%)</p>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
