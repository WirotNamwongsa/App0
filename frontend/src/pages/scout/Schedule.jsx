import { useQuery } from 'react-query'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'

const SLOTS = [
  { value: 'MORNING', label: 'เช้า' },
  { value: 'AFTERNOON', label: 'บ่าย' },
  { value: 'EVENING', label: 'เย็น' },
]

export default function ScoutSchedule() {
  const { data: scout } = useQuery('my-scout', () => api.get('/scouts/my'))

  const campId = scout?.squad?.troop?.camp?.id
  const squadId = scout?.id ? scout.squadId || scout.squad?.id : scout?.squadId

  const { data: schedules = [], isLoading } = useQuery(
    ['my-schedule-scout', campId],
    () => api.get(`/schedules?campId=${campId}`),
    { enabled: !!campId }
  )

  const mySchedules = schedules.filter(s => 
  s.squadIds?.includes(squadId) || 
  (s.activityGroup && s.activityGroup.squads?.some(sq => sq.id === squadId))
)
  const grouped = {}
  mySchedules.forEach(s => {
    const dateKey = new Date(s.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    const slotKey = s.slot
    if (!grouped[dateKey]) grouped[dateKey] = {}
    if (!grouped[dateKey][slotKey]) grouped[dateKey][slotKey] = []
    grouped[dateKey][slotKey].push(s)
  })

  return (
    <div className="page">
      <PageHeader title="ตารางกิจกรรมของฉัน" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-scout-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📅</p>
          <p>ยังไม่มีตารางกิจกรรมสำหรับฉัน</p>
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
                    <p className="text-xs font-semibold text-scout-700 mb-1">{slot.label}</p>
                    {items.map(s => (
                      <p key={s.id} className="text-sm text-scout-900">
                        {s.activity?.name}
                      </p>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

    </div>
  )
}
