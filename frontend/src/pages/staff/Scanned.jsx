import { useQuery } from 'react-query'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import BottomNav from '../../components/BottomNav'
import PageHeader from '../../components/PageHeader'
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react'

export default function StaffScanned() {


  const { data: me } = useQuery('me-scanned', () => api.get('/auth/me'))
  const activityId = me?.staffActivity?.id

  const { data: scanned = [], isLoading } = useQuery(
    ['scanned', activityId],
    () => api.get(`/attendance?activityId=${activityId}`),
    { enabled: !!activityId, refetchInterval: 10000 }
  )

  const passed = scanned.filter(a => !a.outOfSchedule)
  const outOfSchedule = scanned.filter(a => a.outOfSchedule)

  return (
    <div className="page">
      <PageHeader title={me?.staffActivity?.name || 'รายชื่อ'} />

      {/* Summary */}
      <div className="flex gap-3 mb-5">
        <div className="card flex-1 text-center py-3">
          <p className="text-2xl font-display font-bold text-scout-900 dark:text-white">{scanned.length}</p>
          <p className="text-xs text-gray-400">สแกนทั้งหมด</p>
        </div>
        <div className="card flex-1 text-center py-3">
          <p className="text-2xl font-display font-bold text-green-600">{passed.length}</p>
          <p className="text-xs text-gray-400">ตามตาราง</p>
        </div>
        <div className="card flex-1 text-center py-3">
          <p className="text-2xl font-display font-bold text-orange-500">{outOfSchedule.length}</p>
          <p className="text-xs text-gray-400">นอกตาราง</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-scout-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : scanned.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p>ยังไม่มีการสแกน</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scanned.map((a, i) => (
            <div key={a.id} className="card flex items-center gap-3">
              <span className="text-xs text-gray-300 w-5 text-center">{i + 1}</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${a.outOfSchedule ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                {a.outOfSchedule
                  ? <AlertTriangle size={16} className="text-orange-500" />
                  : <CheckCircle size={16} className="text-green-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-scout-900 dark:text-white text-sm truncate">
                  {a.scout?.firstName} {a.scout?.lastName}
                </p>
                <p className="text-xs text-gray-400">
                  หมู่ {a.scout?.squad?.number || '-'} · กอง {a.scout?.squad?.troop?.number || '-'}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                <Clock size={12} />
                {new Date(a.scannedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {a.outOfSchedule && (
                <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full flex-shrink-0">
                  นอกตาราง
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}