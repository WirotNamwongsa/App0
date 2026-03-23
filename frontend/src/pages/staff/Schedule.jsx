import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { Calendar, Clock } from 'lucide-react'

const SLOTS = [
  { value: 'MORNING', label: 'เช้า' },
  { value: 'AFTERNOON', label: 'บ่าย' },
  { value: 'EVENING', label: 'เย็น' },
]

export default function StaffSchedule() {
  const navigate = useNavigate()

  const { data: me } = useQuery('staff-me', () => api.get('/auth/me'))
  const activity = me?.staffActivity
  const activityId = activity?.id

  const { data: schedules = [], isLoading } = useQuery(
    ['staff-schedules', activityId],
    () => api.get(`/schedules?activityId=${activityId}`),
    { enabled: !!activityId }
  )

  const grouped = {}
  if (!isLoading && schedules.length > 0) {
    schedules.forEach(s => {
      const d = new Date(s.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
      if (!grouped[d]) grouped[d] = []
      grouped[d].push(s)
    })
  }

  return (
    <div className="page">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {activity?.name ? `ตารางกิจกรรม: ${activity.name}` : 'ตารางกิจกรรมของฉัน'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          กำหนดการทำกิจกรรมสำหรับแต่ละกลุ่มกิจกรรม
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-scout-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ไม่มีกิจกรรม */}
      {!isLoading && !activityId && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-scout-50 dark:bg-scout-900/30 flex items-center justify-center mb-4">
            <Calendar size={36} className="text-scout-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">ยังไม่ได้รับมอบหมายกิจกรรม</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500">กรุณาติดต่อผู้ดูแลระบบ</p>
        </div>
      )}

      {/* ไม่มีตาราง */}
      {!isLoading && activityId && schedules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-scout-50 dark:bg-scout-900/30 flex items-center justify-center mb-4">
            <Calendar size={36} className="text-scout-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">ยังไม่มีตารางกิจกรรม</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500">ยังไม่มีกำหนดการสำหรับกิจกรรมนี้</p>
        </div>
      )}

      {/* Schedule list */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="rounded-2xl border border-gray-100 dark:border-scout-600 bg-white dark:bg-scout-800 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gradient-to-r from-scout-50 to-emerald-50 dark:from-scout-900/20 dark:to-emerald-900/20 border-b border-gray-100 dark:border-scout-600">
              <h3 className="text-lg font-bold text-scout-900 dark:text-white">{date}</h3>
              <p className="text-sm text-scout-600 dark:text-scout-400">{items.length} กำหนดการ</p>
            </div>
            <div className="p-5 space-y-3">
              {items.map((s) => {
                const slotLabel = SLOTS.find(sl => sl.value === s.slot)?.label

                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600 hover:shadow-md hover:border-scout-300 dark:hover:border-scout-500 transition-all cursor-pointer"
                    onClick={() => navigate(`/staff/schedule/${s.id}/participants`)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-scout-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <Clock size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                          {s.activity?.name || 'ไม่ระบุ'}
                        </h4>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-scout-100 dark:bg-scout-900/40 text-scout-700 dark:text-scout-300">
                          {slotLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {s.activityGroup?.name && (
                          <span className="font-medium text-scout-600 dark:text-scout-400">
                            {s.activityGroup.name}
                          </span>
                        )}
                        {s.camp?.name && <span>· {s.camp.name}</span>}
                        {s.squadIds?.length > 0 && (
                          <span>· {s.squadIds.length} หมู่</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-scout-600 dark:text-scout-400 flex-shrink-0">
                      ดูรายละเอียด →
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}