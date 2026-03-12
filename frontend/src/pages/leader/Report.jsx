import { useQuery } from 'react-query'
import api from '../../lib/api'
import BottomNav from '../../components/BottomNav'
import PageHeader from '../../components/PageHeader'
import { CheckCircle, XCircle } from 'lucide-react'

const typeLabel = { MAIN: 'กิจกรรมหลัก', SPECIAL: 'กิจกรรมพิเศษ', FREE: 'กิจกรรมยามว่าง' }
const typeClass = { MAIN: 'badge-main', SPECIAL: 'badge-special', FREE: 'badge-free' }

export default function LeaderReport() {
  const { data: me } = useQuery('me', () => api.get('/auth/me'))
  const squadId = me?.leadingSquad?.id

  const { data, isLoading } = useQuery(
    ['squad-report', squadId],
    () => api.get(`/reports/squad/${squadId}`),
    { enabled: !!squadId }
  )

  const { data: allActivities = [] } = useQuery('activities', () => api.get('/activities'))

  const scouts = data?.squad?.scouts || []
  const groups = { MAIN: [], SPECIAL: [], FREE: [] }
  allActivities.forEach(a => { if (groups[a.type]) groups[a.type].push(a) })

  // สถิติรวม
  const stats = Object.entries(groups).map(([type, acts]) => {
    const attended = scouts.reduce((sum, sc) => {
      const count = sc.attendances?.filter(a => acts.some(act => act.id === a.activityId)).length || 0
      return sum + count
    }, 0)
    const total = scouts.length * acts.length
    return { type, attended, total, pct: total ? Math.round(attended / total * 100) : 0 }
  })

  return (
    <div className="page">
      <PageHeader title="รายงานหมู่" showBack />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-scout-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ภาพรวม */}
          <div className="card mb-5">
            <p className="text-sm font-semibold text-scout-800 dark:text-scout-200 mb-3">ภาพรวมหมู่</p>
            <div className="space-y-3">
              {stats.map(s => (
                <div key={s.type}>
                  <div className="flex justify-between mb-1">
                    <span className={typeClass[s.type]}>{typeLabel[s.type]}</span>
                    <span className="text-xs text-gray-500">{s.attended}/{s.total} ({s.pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-scout-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.pct > 80 ? 'bg-green-500' : s.pct > 50 ? 'bg-scout-500' : 'bg-yellow-500'}`}
                      style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* รายบุคคล */}
          <p className="text-sm font-semibold text-scout-800 dark:text-scout-200 mb-3">รายบุคคล</p>
          <div className="space-y-3">
            {scouts.map(sc => {
              const attended = new Set(sc.attendances?.map(a => a.activityId))
              const mainDone = groups.MAIN.filter(a => attended.has(a.id)).length
              const specialDone = groups.SPECIAL.filter(a => attended.has(a.id)).length
              const freeDone = groups.FREE.filter(a => attended.has(a.id)).length
              const award = mainDone >= 5 && specialDone >= 3

              return (
                <div key={sc.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-scout-900 dark:text-white">{sc.firstName} {sc.lastName}</p>
                      <p className="text-xs text-gray-400">{sc.school || '-'}</p>
                    </div>
                    {award
                      ? <span className="text-xs bg-gold-100 text-gold-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full font-medium">🏆 Award</span>
                      : <span className="text-xs bg-gray-100 dark:bg-scout-800 text-gray-500 px-2 py-1 rounded-full">ยังไม่ครบ</span>
                    }
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'หลัก', done: mainDone, total: groups.MAIN.length },
                      { label: 'พิเศษ', done: specialDone, total: groups.SPECIAL.length },
                      { label: 'ว่าง', done: freeDone, total: groups.FREE.length },
                    ].map(({ label, done, total }) => (
                      <div key={label} className="bg-gray-50 dark:bg-scout-800 rounded-xl p-2 text-center">
                        <p className="text-lg font-display font-bold text-scout-900 dark:text-white">{done}<span className="text-xs text-gray-400">/{total}</span></p>
                        <p className="text-xs text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* กิจกรรมที่ยังขาด */}
                  {[...groups.MAIN, ...groups.SPECIAL].filter(a => !attended.has(a.id)).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-scout-800">
                      <p className="text-xs text-gray-400 mb-1">ยังขาด:</p>
                      <div className="flex flex-wrap gap-1">
                        {[...groups.MAIN, ...groups.SPECIAL].filter(a => !attended.has(a.id)).map(a => (
                          <span key={a.id} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-2 py-0.5 rounded-full">
                            {a.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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