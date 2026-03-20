import { useQuery } from 'react-query'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { useState } from 'react'
import { Calendar, Clock, Users, X } from 'lucide-react'

const SLOTS = [
  { value: 'MORNING', label: 'เช้า' },
  { value: 'AFTERNOON', label: 'บ่าย' },
  { value: 'EVENING', label: 'เย็น' },
]

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-scout-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-scout-600">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      <button
        onClick={onClose}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-scout-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  )
}

export default function CampSchedule() {
  const { user } = useAuthStore()
  const [viewingSchedule, setViewingSchedule] = useState(null)

  const { data: activities = [] } = useQuery('activities', () => api.get('/activities'))
  const { data: activityGroups = [] } = useQuery('activity-groups', () => api.get('/activity-groups'))
  const { data: schedules = [] } = useQuery(['schedules', user.campId], () =>
    api.get(`/schedules?campId=${user.campId}`)
  )

  // group schedules by date
  const grouped = {}
  schedules.forEach(s => {
    const d = new Date(s.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(s)
  })

  return (
    <div className="page">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ตารางกิจกรรม</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          กำหนดการทำกิจกรรมสำหรับแต่ละกลุ่มกิจกรรม
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { label: 'กลุ่มกิจกรรม',    value: activityGroups.length,      icon: <Users    size={16} /> },
          { label: 'กำหนดการทั้งหมด', value: schedules.length,           icon: <Calendar size={16} /> },
          { label: 'วันที่มีกิจกรรม', value: Object.keys(grouped).length, icon: <Clock    size={16} /> },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-100 dark:border-scout-600 bg-white dark:bg-scout-800 px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-scout-100 dark:bg-scout-900/40 text-scout-600 dark:text-scout-400 flex items-center justify-center flex-shrink-0">
              {stat.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

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
                const activity = activities.find(a => a.id === s.activityId)
                const group = activityGroups.find(g =>
                  g.id === s.activityGroupId ||
                  g.squads?.some(sq => sq.id === s.squad?.id)
                )

                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600 hover:shadow-md hover:border-scout-300 dark:hover:border-scout-500 transition-all cursor-pointer"
                    onClick={() => setViewingSchedule(s)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-scout-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <Clock size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                          {activity?.name || 'ไม่ระบุ'}
                        </h4>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-scout-100 dark:bg-scout-900/40 text-scout-700 dark:text-scout-300">
                          {slotLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {group && (
                          <span className="font-medium text-scout-600 dark:text-scout-400">
                            {group.name}
                          </span>
                        )}
                        {s.squadIds?.length > 0 && (
                          <span>· {s.squadIds.length} หมู่</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {schedules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-scout-50 dark:bg-scout-900/30 flex items-center justify-center mb-4">
            <Calendar size={36} className="text-scout-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">ยังไม่มีตารางกิจกรรม</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500">ยังไม่มีกำหนดการทำกิจกรรม</p>
        </div>
      )}

      {/* Detail Modal */}
      {viewingSchedule && (() => {
        const s = viewingSchedule
        const activity = activities.find(a => a.id === s.activityId)
        const slotLabel = SLOTS.find(sl => sl.value === s.slot)?.label
        const group = activityGroups.find(g =>
          g.id === s.activityGroupId ||
          g.squads?.some(sq => sq.id === s.squad?.id)
        )
        const allGroupSquads = group?.squads || []
        const rawIds = (s.squadIds?.length > 0)
          ? s.squadIds
          : s.squad
            ? [s.squad.id]
            : allGroupSquads.map(sq => sq.id)
        const joinedIds = new Set(rawIds)
        const joinedSquads  = allGroupSquads.filter(sq => joinedIds.has(sq.id))
        const missingSquads = allGroupSquads.filter(sq => !joinedIds.has(sq.id))

        return (
          <Modal onClose={() => setViewingSchedule(null)}>
            <ModalHeader title="รายละเอียดกำหนดการ" onClose={() => setViewingSchedule(null)} />

            <div className="px-6 py-5 space-y-5">

              {/* ข้อมูลหลัก */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-scout-50 to-emerald-50 dark:from-scout-900/30 dark:to-emerald-900/20 border border-scout-100 dark:border-scout-600">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-scout-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Clock size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{activity?.name || 'ไม่ระบุ'}</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-scout-100 dark:bg-scout-900/40 text-scout-700 dark:text-scout-300">
                      {slotLabel}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-scout-800 text-gray-600 dark:text-gray-300">
                      {new Date(s.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {group && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        {group.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* หมู่ที่เข้าร่วม */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">หมู่ที่เข้าร่วม</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    {joinedSquads.length} หมู่
                  </span>
                </div>
                {joinedSquads.length > 0 ? (
                  <div className="space-y-2">
                    {joinedSquads.map(sq => (
                      <div key={sq.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {sq.name || `กอง ${sq.troop?.number} หมู่ ${sq.number}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {sq._count?.scouts || 0} คน
                            {sq.leader && ` · ผู้กำกับ: ${sq.leader.name}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-3">ไม่มีหมู่เข้าร่วม</p>
                )}
              </div>

              {/* หมู่ที่ยังไม่มีกิจกรรม */}
              {missingSquads.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">หมู่ที่ยังไม่มีกิจกรรมนี้</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      {missingSquads.length} หมู่
                    </span>
                  </div>
                  <div className="space-y-2">
                    {missingSquads.map(sq => (
                      <div key={sq.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-500 text-xs font-bold">–</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {sq.name || `กอง ${sq.troop?.number} หมู่ ${sq.number}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {sq._count?.scouts || 0} คน
                            {sq.leader && ` · ผู้กำกับ: ${sq.leader.name}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {missingSquads.length === 0 && joinedSquads.length > 0 && (
                <div className="text-center py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">✓ ทุกหมู่ในกลุ่มเข้าร่วมแล้ว</p>
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setViewingSchedule(null)}
                className="w-full px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 text-white text-sm font-semibold transition"
              >
                ปิด
              </button>
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}