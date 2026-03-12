import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import BottomNav from '../../components/BottomNav'
import PageHeader from '../../components/PageHeader'
import toast from 'react-hot-toast'

const SLOTS = [{ value: 'MORNING', label: 'เช้า' }, { value: 'AFTERNOON', label: 'บ่าย' }, { value: 'EVENING', label: 'เย็น' }]

export default function CampSchedule() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [form, setForm] = useState({ activityId: '', date: '', slot: 'MORNING', squadIds: [] })
  const [showForm, setShowForm] = useState(false)

  const { data: activities = [] } = useQuery('activities', () => api.get('/activities'))
  const { data: camp } = useQuery('camp-my', () => api.get('/camps/my'))
  const { data: schedules = [] } = useQuery(['schedules', user.campId], () =>
    api.get(`/schedules?campId=${user.campId}`)
  )

  const addMutation = useMutation(
    data => api.post('/schedules', { ...data, campId: user.campId }),
    { onSuccess: () => { qc.invalidateQueries(['schedules']); setShowForm(false); toast.success('บันทึกตารางสำเร็จ') } }
  )

  const allSquads = camp?.troops?.flatMap(t => t.squads?.map(sq => ({ ...sq, troopNumber: t.number }))) || []

  function toggleSquad(id) {
    setForm(f => ({
      ...f, squadIds: f.squadIds.includes(id) ? f.squadIds.filter(x => x !== id) : [...f.squadIds, id]
    }))
  }

  const grouped = {}
  schedules.forEach(s => {
    const d = new Date(s.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(s)
  })

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-display font-bold text-scout-900">ตารางกิจกรรม</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4 py-2.5">+ เพิ่ม</button>
      </div>

      {showForm && (
        <div className="card mb-5 space-y-3">
          <h3 className="font-semibold text-scout-800">เพิ่มกิจกรรมในตาราง</h3>
          <select className="input" value={form.activityId} onChange={e => setForm(f => ({ ...f, activityId: e.target.value }))}>
            <option value="">เลือกกิจกรรม</option>
            {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <div className="flex gap-2">
            {SLOTS.map(s => (
              <button key={s.value} onClick={() => setForm(f => ({ ...f, slot: s.value }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${form.slot === s.value ? 'bg-scout-700 text-white' : 'bg-scout-50 text-scout-700'}`}>
                {s.label}
              </button>
            ))}
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">เลือกหมู่:</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {allSquads.map(sq => (
                <label key={sq.id} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-scout-50">
                  <input type="checkbox" checked={form.squadIds.includes(sq.id)} onChange={() => toggleSquad(sq.id)} className="rounded" />
                  <span className="text-sm">กอง {sq.troopNumber} หมู่ {sq.number}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => addMutation.mutate(form)} className="btn-primary flex-1">บันทึก</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">ยกเลิก</button>
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">{date}</p>
          <div className="space-y-2">
            {items.map(s => (
              <div key={s.id} className="card flex items-center gap-3">
                <div className="w-12 text-center">
                  <span className="text-xs bg-scout-100 text-scout-700 px-2 py-1 rounded-lg">{SLOTS.find(sl => sl.value === s.slot)?.label}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-scout-900">{s.activity?.name}</p>
                  {s.squad && <p className="text-xs text-gray-400">กอง {s.squad?.troop?.number} หมู่ {s.squad?.number}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {schedules.length === 0 && !showForm && (
        <div className="card text-center py-8 text-gray-400">ยังไม่มีตารางกิจกรรม</div>
      )}
      <BottomNav />
    </div>
  )
}
