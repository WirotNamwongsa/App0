import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import PageHeader from '../../components/PageHeader'
import toast from 'react-hot-toast'
import { Trash2, Plus, Calendar, Clock, Users, X, Pencil } from 'lucide-react'

const SLOTS = [
  { value: 'MORNING', label: 'เช้า' },
  { value: 'AFTERNOON', label: 'บ่าย' },
  { value: 'EVENING', label: 'เย็น' },
]

const INPUT_CLS = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 bg-gray-50 dark:bg-scout-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-scout-400 focus:border-transparent transition text-sm"

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

const EMPTY_FORM = { activityId: '', date: '', slot: 'MORNING', squadIds: [], activityGroupId: '' }

export default function CampSchedule() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [viewingSchedule, setViewingSchedule] = useState(null)

  const { data: activities = [] } = useQuery('activities', () => api.get('/activities'))
  const { data: activityGroups = [] } = useQuery('activity-groups', () => api.get('/activity-groups'))
  const { data: camp } = useQuery('camp-my', () => api.get('/camps/my'))
  const { data: schedules = [] } = useQuery(['schedules', user.campId], () =>
    api.get(`/schedules?campId=${user.campId}`)
  )

  const addMutation = useMutation(
    data => api.post('/schedules', { ...data, campId: user.campId }),
    {
      onSuccess: () => {
        qc.invalidateQueries(['schedules'])
        closeForm()
        toast.success('บันทึกตารางสำเร็จ')
      }
    }
  )

  const editMutation = useMutation(
    ({ id, data }) => api.put(`/schedules/${id}`, { ...data, campId: user.campId }),
    {
      onSuccess: () => {
        qc.invalidateQueries(['schedules'])
        closeForm()
        toast.success('แก้ไขตารางสำเร็จ')
      }
    }
  )

  const deleteMutation = useMutation(
    id => api.delete(`/schedules/${id}`),
    { onSuccess: () => { qc.invalidateQueries(['schedules']); toast.success('ลบตารางสำเร็จ') } }
  )

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (s) => {
    const groupId = s.activityGroupId || activityGroups.find(g => g.squads?.some(sq => sq.id === s.squad?.id))?.id || ''
    const group = activityGroups.find(g => g.id === groupId)
    const allSquadIds = group?.squads?.map(sq => sq.id) || s.squadIds || (s.squad ? [s.squad.id] : [])
    setForm({
      activityId: s.activityId || '',
      date: s.date ? s.date.slice(0, 10) : '',
      slot: s.slot || 'MORNING',
      squadIds: allSquadIds,
      activityGroupId: groupId,
    })
    setEditingId(s.id)
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (editingId) {
      editMutation.mutate({ id: editingId, data: form })
    } else {
      addMutation.mutate(form)
    }
  }

  const handleSelectGroup = (groupId) => {
    const group = activityGroups.find(g => g.id === groupId)
    const allSquadIds = group?.squads?.map(sq => sq.id) || []
    setForm(f => ({ ...f, activityGroupId: groupId, squadIds: allSquadIds }))
  }

  const selectedGroup = activityGroups.find(g => g.id === form.activityGroupId)
  const availableSquads = selectedGroup?.squads || []

  function toggleSquad(id) {
    setForm(f => ({
      ...f,
      squadIds: f.squadIds.includes(id)
        ? f.squadIds.filter(x => x !== id)
        : [...f.squadIds, id]
    }))
  }

  const grouped = {}
  schedules.forEach(s => {
    const d = new Date(s.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(s)
  })

  const isFormValid = form.activityGroupId && form.activityId && form.date && form.squadIds.length > 0

  return (
    <div className="page">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ตารางกิจกรรม</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            จัดการกำหนดการทำกิจกรรมสำหรับแต่ละกลุ่มกิจกรรม
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 active:scale-95 text-white text-sm font-semibold shadow-lg shadow-scout-600/25 transition-all duration-150"
        >
          <Plus size={16} /> เพิ่มกำหนดการ
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { label: 'กลุ่มกิจกรรม',    value: activityGroups.length,       icon: <Users    size={16} /> },
          { label: 'กำหนดการทั้งหมด', value: schedules.length,            icon: <Calendar size={16} /> },
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

                    {/* ✅ เพิ่ม stopPropagation ทั้ง 2 ปุ่ม */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(s) }}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 dark:border-scout-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-scout-600 transition active:scale-95"
                      >
                        <Pencil size={13} /> แก้ไข
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(s.id) }}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition active:scale-95"
                      >
                        <Trash2 size={13} /> ลบ
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {schedules.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-scout-50 dark:bg-scout-900/30 flex items-center justify-center mb-4">
            <Calendar size={36} className="text-scout-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">ยังไม่มีตารางกิจกรรม</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">เริ่มกำหนดการทำกิจกรรมสำหรับกลุ่มต่างๆ</p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 text-white text-sm font-semibold shadow-lg shadow-scout-600/25 transition-all active:scale-95"
          >
            <Plus size={16} /> เพิ่มกำหนดการแรก
          </button>
        </div>
      )}

      {/* ══ Add / Edit Modal ══════════════════════════════════════════════════ */}
      {showForm && (
        <Modal onClose={closeForm}>
          <ModalHeader
            title={editingId ? 'แก้ไขกำหนดการกิจกรรม' : 'เพิ่มกำหนดการกิจกรรม'}
            onClose={closeForm}
          />
          <div className="px-6 py-5 space-y-5">

            {/* กลุ่มกิจกรรม */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                กลุ่มกิจกรรม *
              </label>
              <select className={INPUT_CLS} value={form.activityGroupId} onChange={e => handleSelectGroup(e.target.value)}>
                <option value="">เลือกกลุ่มกิจกรรม</option>
                {activityGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.squads?.length || 0} หมู่)</option>
                ))}
              </select>
            </div>

            {/* กิจกรรม */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                กิจกรรม *
              </label>
              <select
                className={INPUT_CLS}
                value={form.activityId}
                onChange={e => setForm(f => ({ ...f, activityId: e.target.value }))}
                disabled={!form.activityGroupId}
              >
                <option value="">เลือกกิจกรรม</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            {/* วันที่ + ช่วงเวลา */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  วันที่ *
                </label>
                <input
                  type="date"
                  className={INPUT_CLS}
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  ช่วงเวลา *
                </label>
                <div className="flex gap-1">
                  {SLOTS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setForm(f => ({ ...f, slot: s.value }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        form.slot === s.value
                          ? 'bg-scout-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-scout-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-scout-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* หมู่ในกลุ่ม */}
            {form.activityGroupId && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    หมู่ในกลุ่ม ({form.squadIds.length}/{availableSquads.length} หมู่)
                  </label>
                  <button
                    onClick={() => {
                      const allIds = availableSquads.map(sq => sq.id)
                      const allSelected = allIds.every(id => form.squadIds.includes(id))
                      setForm(f => ({ ...f, squadIds: allSelected ? [] : allIds }))
                    }}
                    className="text-xs font-semibold text-scout-600 dark:text-scout-400 hover:underline"
                  >
                    {availableSquads.every(sq => form.squadIds.includes(sq.id)) ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {availableSquads.length > 0 ? (
                    availableSquads.map(squad => (
                      <label
                        key={squad.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-scout-800/60 border border-gray-100 dark:border-scout-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-scout-600/40 transition"
                      >
                        <input
                          type="checkbox"
                          checked={form.squadIds.includes(squad.id)}
                          onChange={() => toggleSquad(squad.id)}
                          className="rounded text-scout-600 focus:ring-scout-400"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {squad.name || `กอง ${squad.troop?.number} หมู่ ${squad.number}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {squad._count?.scouts || 0} คน
                            {squad.leader && ` · ผู้กำกับ: ${squad.leader.name}`}
                          </p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-sm">ไม่มีหมู่ในกลุ่มนี้</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={closeForm}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-600 transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 text-white text-sm font-semibold shadow-md shadow-scout-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {editingId ? 'บันทึกการแก้ไข' : 'บันทึกกำหนดการ'}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ Detail Modal ══════════════════════════════════════════════════════ */}
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

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-scout-50 to-emerald-50 dark:from-scout-900/30 dark:to-emerald-900/20 border border-scout-100 dark:border-scout-600">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-scout-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Clock size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{activity?.name || 'ไม่ระบุ'}</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-scout-100 dark:bg-scout-900/40 text-scout-700 dark:text-scout-300">{slotLabel}</span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-scout-800 text-gray-600 dark:text-gray-300">
                      {new Date(s.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {group && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">{group.name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">หมู่ที่เข้าร่วม</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">{joinedSquads.length} หมู่</span>
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
                          <p className="text-xs text-gray-400">{sq._count?.scouts || 0} คน{sq.leader && ` · ผู้กำกับ: ${sq.leader.name}`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-3">ไม่มีหมู่เข้าร่วม</p>
                )}
              </div>

              {missingSquads.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">หมู่ที่ยังไม่มีกิจกรรมนี้</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">{missingSquads.length} หมู่</span>
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
                          <p className="text-xs text-gray-400">{sq._count?.scouts || 0} คน{sq.leader && ` · ผู้กำกับ: ${sq.leader.name}`}</p>
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

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setViewingSchedule(null); openEdit(s) }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-scout-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-scout-600 transition"
              >
                <Pencil size={14} /> แก้ไข
              </button>
              <button
                onClick={() => setViewingSchedule(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-scout-600 hover:bg-scout-700 text-white text-sm font-semibold transition"
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