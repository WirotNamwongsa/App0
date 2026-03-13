import { useQuery } from 'react-query'
import api from '../../lib/api'
import BottomNav from '../../components/BottomNav'
import PageHeader from '../../components/PageHeader'

const SLOTS = [
  { value: 'MORNING', label: 'เช้า' },
  { value: 'AFTERNOON', label: 'บ่าย' },
  { value: 'EVENING', label: 'เย็น' },
]

export default function StaffSchedule() {
  const { data: me } = useQuery('staff-me', () => api.get('/auth/me'))
  const activity = me?.staffActivity
  const activityId = activity?.id

  const { data: schedules = [], isLoading } = useQuery(
    ['staff-schedules', activityId],
    () => api.get(`/schedules?activityId=${activityId}`),
    { enabled: !!activityId }
  )

  const grouped = {}
  schedules.forEach(s => {
    const dateKey = new Date(s.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    const slotKey = s.slot
    if (!grouped[dateKey]) grouped[dateKey] = {}
    if (!grouped[dateKey][slotKey]) grouped[dateKey][slotKey] = []
    grouped[dateKey][slotKey].push(s)
  })

  return (
    <div className="page">
      <PageHeader title={activity?.name ? `ตารางกิจกรรม: ${activity.name}` : 'ตารางกิจกรรมของฉัน'} />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-scout-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !activityId ? (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">ℹ️</p>
          <p>ยังไม่ได้ถูกกำหนดเป็นผู้จัดกิจกรรมใด</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📅</p>
          <p>ยังไม่มีตารางสำหรับกิจกรรมนี้</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, slots]) => (
          <div key={date} className="mb-5">
            <p className="text-xs font-semibold text-gray-500 mb-2">{date}</p>
            <div className="space-y-2">
              {SLOTS.map(slot => {
                const items = slots[slot.value] || []
                if (!items.length) return null
                return (
                  <div key={slot.value} className="card">
                    <p className="text-xs font-semibold text-scout-700 mb-2">{slot.label}</p>
                    <div className="space-y-1">
                      {items.map(s => (
                        <div key={s.id} className="flex items-center justify-between text-sm">
                          <span className="text-scout-900">
                            {s.camp?.name || 'ค่ายไม่ระบุ'}
                          </span>
                          {s.squad && (
                            <span className="text-xs text-gray-500">
                              กอง {s.squad?.troop?.number} หมู่ {s.squad?.number}
                            </span>
                          )}
                          {!s.squad && (
                            <span className="text-xs text-gray-400">
                              ทุกหมู่ในค่าย
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      <BottomNav />
    </div>
  )
}
