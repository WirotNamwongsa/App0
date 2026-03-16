import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'

export default function CampDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery('camp-report', () =>
    api.get(`/reports/camp/${user.campId || 'camp-a'}`)
  )

  return (
    <div className="page">
      <PageHeader title={data?.camp?.name || 'ค่ายย่อย'} />
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-scout-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : data && (
        <>
          <div className="card mb-4">
            <p className="text-gray-500 text-sm">สมาชิกทั้งหมด</p>
            <p className="text-3xl font-display font-bold text-scout-900">{data.totalScouts} คน</p>
          </div>

          <h2 className="font-semibold text-scout-800 mb-3 text-sm">สถิติกิจกรรม</h2>
          <div className="space-y-2 mb-5">
            {data.activityStats?.map(act => (
              <div key={act.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-scout-800 font-medium">{act.name}</span>
                  <span className="text-sm font-bold text-scout-700">{act.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-scout-500 rounded-full" style={{ width: `${act.percentage}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{act.attended}/{act.total} คน</p>
              </div>
            ))}
          </div>

          <h2 className="font-semibold text-scout-800 mb-3 text-sm">กองในค่าย</h2>
          <div className="space-y-2">
            {data.camp?.troops?.map(troop => {
              const total = troop.squads.reduce((s, sq) => s + sq.scouts.length, 0)
              return (
                <div key={troop.id} className="card flex items-center justify-between cursor-pointer hover:bg-scout-50"
                  onClick={() => navigate('/camp/structure')}>
                  <div>
                    <p className="font-medium text-scout-900">กอง {troop.number}</p>
                    <p className="text-xs text-gray-400">{total} คน · {troop.squads.length} หมู่</p>
                  </div>
                  <span className="text-gray-300">›</span>
                </div>
              )
            })}
          </div>
        </>
      )}
      <BottomNav />
    </div>
  )
}
